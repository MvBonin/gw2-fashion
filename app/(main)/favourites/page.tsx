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
  title: "My Favourites | GW2 Fashion",
  description: "Your saved Guild Wars 2 fashion templates on GW2 Fashion.",
  robots: { index: false },
};

type ArmorType = "light" | "medium" | "heavy" | null;
type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type TemplateWithUser = TemplateRow & {
  users: { username: string } | null;
  template_tags?: { tags: { name: string } | null }[] | null;
};
function templateTagsToNames(tt: TemplateWithUser["template_tags"]): string[] {
  return (tt ?? []).map((x) => x.tags?.name).filter(Boolean) as string[];
}

interface FavouritesPageProps {
  searchParams: Promise<{
    armor?: string;
    page?: string;
    q?: string;
    tag?: string;
  }>;
}

export default async function FavouritesPage({ searchParams }: FavouritesPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const armorFilter: ArmorType =
    params.armor === "light" || params.armor === "medium" || params.armor === "heavy"
      ? params.armor
      : null;
  const pageRaw = params.page ? parseInt(params.page, 10) : 1;
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const qTrim = params.q?.trim() ?? "";
  const tagTrim = params.tag?.trim() ?? "";

  // All template IDs this user has favourited
  const { data: favRows } = await supabase
    .from("template_favourites")
    .select("template_id")
    .eq("user_id", user.id);
  const favouriteIds: string[] = (favRows ?? []).map((r) => r.template_id);

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

  const noTagMatch = tagTrim.length > 0 && tagTemplateIds.length === 0;
  const filteredIds =
    tagTrim.length > 0
      ? favouriteIds.filter((id) => tagTemplateIds.includes(id))
      : favouriteIds;

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

  let templatesList: TemplateWithUser[] = [];
  let totalCount = 0;

  if (filteredIds.length === 0 || noTagMatch) {
    totalCount = 0;
  } else {
    let query = supabase
      .from("templates")
      .select(selectFields, { count: "exact" })
      .eq("active", true)
      .in("id", filteredIds);

    if (qTrim.length > 0) {
      query = query.ilike("name", `%${qTrim}%`);
    }
    if (armorFilter) {
      query = query.eq("armor_type", armorFilter);
    }
    query = query.order("favourite_count", { ascending: false });
    const fromRow = (page - 1) * TEMPLATES_PAGE_SIZE;
    query = query.range(fromRow, fromRow + TEMPLATES_PAGE_SIZE - 1);

    const result = await query;
    templatesList = (result.data as TemplateWithUser[] | null) ?? [];
    totalCount = result.count ?? 0;
  }

  const totalPages = Math.ceil(totalCount / TEMPLATES_PAGE_SIZE) || 1;
  const from = (page - 1) * TEMPLATES_PAGE_SIZE;

  if (totalPages > 0 && (page < 1 || page > totalPages)) {
    const targetPage = page < 1 ? 1 : totalPages;
    const redirectParams = new URLSearchParams();
    if (qTrim) redirectParams.set("q", qTrim);
    if (tagTrim) redirectParams.set("tag", tagTrim);
    if (armorFilter) redirectParams.set("armor", armorFilter);
    redirectParams.set("page", String(targetPage));
    redirect(`/favourites?${redirectParams.toString()}`);
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold">My Favourites</h1>
          <p className="text-sm text-base-content/60 shrink-0">
            {totalCount === 0
              ? "0 templates"
              : `${from + 1}–${Math.min(from + templatesList.length, from + TEMPLATES_PAGE_SIZE)} of ${totalCount} templates`}
          </p>
        </div>
        <SearchBar basePath="/favourites" showAuthor={false} />
        <FilterButtons
          armorFilter={armorFilter}
          sortOption="new"
          basePath="/favourites"
          showSort={false}
        />
      </div>

      {templatesList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-base-content/70">
            {favouriteIds.length === 0
              ? "You haven't favourited any templates yet. Browse and click the heart on a template to add it here."
              : "No templates match your search."}
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
                isFavourited={true}
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
              basePath="/favourites"
              searchParams={{
                ...(qTrim && { q: qTrim }),
                ...(tagTrim && { tag: tagTrim }),
                ...(armorFilter && { armor: armorFilter }),
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
