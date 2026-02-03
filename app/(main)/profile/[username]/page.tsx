import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import TemplateCard from "@/components/templates/TemplateCard";
import FilterButtons from "@/components/templates/FilterButtons";
import PaginationNav from "@/components/templates/PaginationNav";
import { TEMPLATES_PAGE_SIZE } from "@/lib/utils/pagination";
import type { Database } from "@/types/database.types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type TemplateWithUser = TemplateRow & {
  users: { username: string } | null;
  template_tags?: { tags: { name: string } | null }[] | null;
};
function templateTagsToNames(tt: TemplateWithUser["template_tags"]): string[] {
  return (tt ?? []).map((x) => x.tags?.name).filter(Boolean) as string[];
}
type ArmorType = "light" | "medium" | "heavy" | null;

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    armor?: string;
    page?: string;
  }>;
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { username } = await params;
  const paramsQuery = await searchParams;
  const armorFilter: ArmorType =
    paramsQuery.armor === "light" || paramsQuery.armor === "medium" || paramsQuery.armor === "heavy"
      ? paramsQuery.armor
      : null;

  const pageRaw = paramsQuery.page ? parseInt(paramsQuery.page, 10) : 1;
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;

  const supabase = await createClient();

  // Case-insensitive search: Load all users and filter in memory
  // Since usernames are unique (case-insensitive), we can safely do this
  const { data: usersData, error } = await supabase
    .from("users")
    .select("id, username, gw2_account_name, gw2_account_name_public, bio")
    .limit(1000); // Reasonable limit for small to medium user base

  if (error) {
    console.error("Error fetching users:", error);
    notFound();
  }

  type UserSelect = Pick<UserProfile, "id" | "username" | "gw2_account_name" | "gw2_account_name_public" | "bio">;
  const users = (usersData ?? []) as UserSelect[];

  // Find user case-insensitively
  const lowerUsername = username.toLowerCase();
  const user = users.find(
    (u) => u.username.toLowerCase() === lowerUsername
  ) as UserSelect | undefined;

  if (!user) {
    notFound();
  }

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
      user_id,
      users(username),
      template_tags(tags(name))
    `;
  let templatesQuery = supabase
    .from("templates")
    .select(selectFields, { count: "exact" })
    .eq("active", true)
    .eq("user_id", user.id)
    .in("armor_type", ["light", "medium", "heavy"])
    .order("created_at", { ascending: false });

  if (armorFilter) {
    templatesQuery = templatesQuery.eq("armor_type", armorFilter);
  }

  const from = (page - 1) * TEMPLATES_PAGE_SIZE;
  const to = from + TEMPLATES_PAGE_SIZE - 1;
  templatesQuery = templatesQuery.range(from, to);

  const { data: templates, error: templatesError, count } = await templatesQuery;

  if (templatesError) {
    console.error("Error fetching templates:", templatesError);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / TEMPLATES_PAGE_SIZE) || 1;

  if (totalPages > 0 && (page < 1 || page > totalPages)) {
    const targetPage = page < 1 ? 1 : totalPages;
    const redirectParams = new URLSearchParams();
    if (armorFilter) redirectParams.set("armor", armorFilter);
    redirectParams.set("page", String(targetPage));
    redirect(`/profile/${username.toLowerCase()}?${redirectParams.toString()}`);
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
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-4xl font-bold mb-4">{user.username}</h1>
        {user.gw2_account_name_public && user.gw2_account_name && (
          <div className="mt-4">
            <p className="text-lg text-base-content/70">
              GW2-Account: {user.gw2_account_name}
            </p>
          </div>
        )}
        {user.bio && (
          <div className="mt-4">
            <p className="text-base-content/80 whitespace-pre-line">{user.bio}</p>
          </div>
        )}
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-semibold">Templates</h2>
          <p className="text-sm text-base-content/60 shrink-0">
            {totalCount === 0
              ? "0 templates"
              : `${from + 1}–${Math.min(from + templatesList.length, from + TEMPLATES_PAGE_SIZE)} of ${totalCount} templates`}
          </p>
        </div>
        <FilterButtons
          armorFilter={armorFilter}
          sortOption="new"
          basePath={`/profile/${username.toLowerCase()}`}
          showSort={false}
        />
        {templatesList.length === 0 ? (
          <p className="text-base-content/70">No active templates yet.</p>
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
                basePath={`/profile/${username.toLowerCase()}`}
                searchParams={armorFilter ? { armor: armorFilter } : {}}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

