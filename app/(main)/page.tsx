import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TemplateCard from "@/components/templates/TemplateCard";
import FilterButtons from "@/components/templates/FilterButtons";
import PaginationNav from "@/components/templates/PaginationNav";
import SearchBar from "@/components/templates/SearchBar";
import { TEMPLATES_PAGE_SIZE } from "@/lib/utils/pagination";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Fashion Templates | GW2 Fashion",
  description:
    "Browse and share Guild Wars 2 fashion templates. Discover looks by armor type, tags, and creators.",
};

type ArmorType = "light" | "medium" | "heavy" | null;
type SortOption = "trending" | "popular" | "new";

type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type TemplateWithUser = TemplateRow & {
  users: { username: string } | null;
  template_tags?: { tags: { name: string } | null }[] | null;
};
function templateTagsToNames(tt: TemplateWithUser["template_tags"]): string[] {
  return (tt ?? []).map((x) => x.tags?.name).filter(Boolean) as string[];
}

interface HomePageProps {
  searchParams: Promise<{
    armor?: string;
    sort?: string;
    page?: string;
    q?: string;
    tag?: string;
    author?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Parse filters from URL
  const armorFilter: ArmorType =
    params.armor === "light" || params.armor === "medium" || params.armor === "heavy"
      ? params.armor
      : null;

  const sortOption: SortOption =
    params.sort === "trending" || params.sort === "popular" || params.sort === "new"
      ? params.sort
      : "trending"; // Default to "trending"

  const pageRaw = params.page ? parseInt(params.page, 10) : 1;
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;

  const qTrim = params.q?.trim() ?? "";
  const tagTrim = params.tag?.trim() ?? "";
  const authorTrim = params.author?.trim() ?? "";

  // Resolve author filter: user IDs where username matches
  let authorUserIds: string[] = [];
  if (authorTrim.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .ilike("username", `%${authorTrim}%`);
    authorUserIds = (users ?? []).map((r) => r.id);
  }

  // Resolve tag filter: template IDs that have a matching tag
  let tagTemplateIds: string[] = [];
  if (tagTrim.length > 0) {
    const { data: tags } = await supabase
      .from("tags")
      .select("id")
      .ilike("name", `%${tagTrim}%`);
    const tagIds = (tags ?? []).map((r) => r.id);
    if (tagIds.length > 0) {
      const { data: rows } = await supabase
        .from("template_tags")
        .select("template_id")
        .in("tag_id", tagIds);
      tagTemplateIds = [...new Set((rows ?? []).map((r) => r.template_id))];
    }
  }

  // Build query (only active templates)
  const selectFields = `
      id,
      name,
      slug,
      fashion_code,
      armor_type,
      image_url,
      view_count,
      copy_count,
      favourite_count,
      created_at,
      user_id,
      users(username),
      template_tags(tags(name))
    `;
  let query = supabase
    .from("templates")
    .select(selectFields, { count: "exact" })
    .eq("active", true);

  const noAuthorMatch = authorTrim.length > 0 && authorUserIds.length === 0;
  const noTagMatch = tagTrim.length > 0 && tagTemplateIds.length === 0;
  const skipQuery = noAuthorMatch || noTagMatch;

  if (!skipQuery) {
    if (authorTrim.length > 0) {
      query = query.in("user_id", authorUserIds);
    }
    if (tagTrim.length > 0) {
      query = query.in("id", tagTemplateIds);
    }
    if (qTrim.length > 0) {
      query = query.ilike("name", `%${qTrim}%`);
    }
    if (armorFilter) {
      query = query.eq("armor_type", armorFilter);
    }
    switch (sortOption) {
      case "trending":
        query = query
          .order("trending_score", { ascending: false });
        break;
      case "popular":
        query = query
          .order("favourite_count", { ascending: false })
          .order("copy_count", { ascending: false });
        break;
      case "new":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }
    const fromRow = (page - 1) * TEMPLATES_PAGE_SIZE;
    query = query.range(fromRow, fromRow + TEMPLATES_PAGE_SIZE - 1);
  }

  let templates: TemplateWithUser[] | null = null;
  let fetchError: unknown = null;
  let count: number | null = null;

  if (skipQuery) {
    templates = [];
    count = 0;
  } else {
    const result = await query;
    templates = result.data as TemplateWithUser[] | null;
    fetchError = result.error ?? null;
    count = result.count ?? null;
  }

  const from = (page - 1) * TEMPLATES_PAGE_SIZE;

  if (fetchError) {
    console.error("Error fetching templates:", fetchError);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / TEMPLATES_PAGE_SIZE) || 1;

  if (totalPages > 0 && (page < 1 || page > totalPages)) {
    const targetPage = page < 1 ? 1 : totalPages;
    const redirectParams = new URLSearchParams();
    if (qTrim) redirectParams.set("q", qTrim);
    if (tagTrim) redirectParams.set("tag", tagTrim);
    if (authorTrim) redirectParams.set("author", authorTrim);
    if (armorFilter) redirectParams.set("armor", armorFilter);
    redirectParams.set("sort", sortOption);
    redirectParams.set("page", String(targetPage));
    redirect(`/?${redirectParams.toString()}`);
  }

  const templatesList: TemplateWithUser[] = (templates as TemplateWithUser[] | null) ?? [];

  // For logged-in user: which of these templates are favourited?
  let favouritedTemplateIds = new Set<string>();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  if (currentUser && templatesList.length > 0) {
    const { data: favourites } = await supabase
      .from("template_favourites")
      .select("template_id")
      .eq("user_id", currentUser.id)
      .in(
        "template_id",
        templatesList.map((t) => t.id)
      );
    if (favourites) {
      favouritedTemplateIds = new Set(favourites.map((r) => r.template_id));
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold">Browse Fashion Templates</h1>
          <p className="text-sm text-base-content/60 shrink-0">
            {totalCount === 0
              ? "0 templates"
              : `${from + 1}–${Math.min(from + templatesList.length, from + TEMPLATES_PAGE_SIZE)} of ${totalCount} templates`}
          </p>
        </div>
        {/* Search */}
        <SearchBar />
        {/* Filters */}
        <FilterButtons
          armorFilter={armorFilter}
          sortOption={sortOption}
        />
      </div>

      {/* Templates Grid */}
      {templatesList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-base-content/70">
            No templates found. Be the first to create one!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {templatesList.map((template) => (
              <TemplateCard
                key={template.id}
                id={template.id}
                name={template.name}
                slug={template.slug}
                fashion_code={template.fashion_code}
                armor_type={template.armor_type}
                image_url={template.image_url}
                view_count={template.view_count}
                copy_count={template.copy_count}
                favourite_count={template.favourite_count ?? 0}
                isFavourited={favouritedTemplateIds.has(template.id)}
                user={template.users}
                templateUserId={template.user_id ?? null}
                tags={templateTagsToNames(template.template_tags)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <PaginationNav
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={TEMPLATES_PAGE_SIZE}
              basePath="/"
              searchParams={{
                ...(qTrim && { q: qTrim }),
                ...(tagTrim && { tag: tagTrim }),
                ...(authorTrim && { author: authorTrim }),
                ...(armorFilter && { armor: armorFilter }),
                sort: sortOption,
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
