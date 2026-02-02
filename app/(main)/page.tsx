import { createClient } from "@/lib/supabase/server";
import TemplateCard from "@/components/templates/TemplateCard";
import FilterButtons from "@/components/templates/FilterButtons";

type ArmorType = "light" | "medium" | "heavy" | null;
type SortOption = "trending" | "popular" | "new";

interface HomePageProps {
  searchParams: Promise<{
    armor?: string;
    sort?: string;
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

  // Build query
  let query = supabase
    .from("templates")
    .select(
      `
      id,
      name,
      slug,
      fashion_code,
      armor_type,
      image_url,
      view_count,
      copy_count,
      created_at,
      users(username)
    `
    );

  // Apply armor filter
  if (armorFilter) {
    query = query.eq("armor_type", armorFilter);
  }

  // Apply sort
  switch (sortOption) {
    case "trending":
      // Most views in last 7 days
      query = query
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("view_count", { ascending: false });
      break;
    case "popular":
      // Most copies all-time
      query = query.order("copy_count", { ascending: false });
      break;
    case "new":
    default:
      // Most recent
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Limit results (pagination can be added later)
  query = query.limit(50);

  const { data: templates, error } = await query;

  if (error) {
    console.error("Error fetching templates:", error);
  }

  const templatesList = templates || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse Fashion Templates</h1>
        
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              user={template.users}
            />
          ))}
        </div>
      )}
    </div>
  );
}
