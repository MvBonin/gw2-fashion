import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import TemplateDetailClient from "@/components/templates/TemplateDetailClient";
import TemplateActions from "@/components/templates/TemplateActions";
import TemplateExtraImagesGallery from "@/components/templates/TemplateExtraImagesGallery";
import ViewTracker from "@/components/templates/ViewTracker";
import FavouriteButton from "@/components/templates/FavouriteButton";
import { decodeFashionCode, WEAPON_SLOTS } from "@/lib/gw2/chatLink";
import { fetchSkins, fetchColors, getDisplayRgb, rgbToHex, type SkinsAndColorsEntry } from "@/lib/gw2/gw2Api";
import type { Database } from "@/types/database.types";

type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type TemplateDetail = Pick<
  TemplateRow,
  | "id"
  | "name"
  | "slug"
  | "fashion_code"
  | "armor_type"
  | "image_url"
  | "description"
  | "view_count"
  | "copy_count"
  | "favourite_count"
  | "created_at"
  | "user_id"
  | "is_private"
> & {
  users: { id: string; username: string } | null;
  template_tags?: { tags: { name: string } | null }[] | null;
  template_extra_images?: { position: number; image_url: string }[] | null;
};
function templateTagsToNames(tt: TemplateDetail["template_tags"]): string[] {
  return (tt ?? []).map((x) => x.tags?.name).filter(Boolean) as string[];
}

interface TemplateDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

type TemplateMeta = {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  users: { username: string } | null;
};

async function getTemplateBySlug(slug: string): Promise<TemplateMeta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("name, slug, description, image_url, users(username)")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  if (error || !data) return null;
  return data as unknown as TemplateMeta;
}

export async function generateMetadata({
  params,
}: TemplateDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) {
    return { title: "Template | GW2 Fashion" };
  }
  const description =
    (template.description && template.description.length > 0
      ? template.description.slice(0, 155) + (template.description.length > 155 ? "…" : "")
      : null) ??
    (template.users
      ? `Guild Wars 2 fashion template by ${template.users.username}.`
      : "Guild Wars 2 fashion template on GW2 Fashion.");
  const ogImage = template.image_url ?? "/icon.png";
  return {
    title: `${template.name} | GW2 Fashion`,
    description,
    openGraph: {
      title: `${template.name} | GW2 Fashion`,
      description,
      url: `/template/${template.slug}`,
      images: [{ url: ogImage, alt: template.name }],
    },
  };
}

export default async function TemplateDetailPage({
  params,
}: TemplateDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Load template with user info, tags and extra images (only active)
  const { data, error } = await supabase
    .from("templates")
    .select(
      `
      id,
      name,
      slug,
      fashion_code,
      armor_type,
      image_url,
      description,
      view_count,
      copy_count,
      favourite_count,
      created_at,
      user_id,
      is_private,
      users(id, username),
      template_tags(tags(name)),
      template_extra_images(position, image_url)
    `
    )
    .eq("slug", slug)
    .eq("active", true)
    .single();

  const template = data as TemplateDetail | null;
  if (error || !template) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === template.user_id;
  const tagNames = templateTagsToNames(template.template_tags);

  let isFavourited = false;
  if (user) {
    const { data: fav } = await supabase
      .from("template_favourites")
      .select("template_id")
      .eq("user_id", user.id)
      .eq("template_id", template.id)
      .maybeSingle();
    isFavourited = !!fav;
  }

  let skinsAndColors: SkinsAndColorsEntry[] | null = null;
  const entries = decodeFashionCode(template.fashion_code);
  if (entries && entries.length > 0) {
    const displayEntries = entries.filter(
      (e) => !WEAPON_SLOTS.has(e.slot) && e.skinId > 1
    );
    const skinIds = displayEntries
      .filter((e) => e.slot !== "Outfit")
      .map((e) => e.skinId)
      .filter((id) => id > 0);
    const colorIds = displayEntries.flatMap((e) => e.colorIds).filter((id): id is number => id !== null && id > 1);
    const [skins, colors] = await Promise.all([fetchSkins(skinIds), fetchColors(colorIds)]);
    const skinMap = new Map(skins.map((s) => [s.id, s]));
    const colorMap = new Map(colors.map((c) => [c.id, c]));
    skinsAndColors = displayEntries.map((e) => {
      const skin = e.slot === "Outfit" ? undefined : skinMap.get(e.skinId);
      const skinName = e.slot === "Outfit" ? `Outfit (ID: ${e.skinId})` : (skin?.name ?? `Skin ${e.skinId}`);
      const colorEntries = e.colorIds
        .filter((id): id is number => id !== null && id !== 1)
        .map((id) => {
          const fallbackRgb: [number, number, number] = [128, 128, 128];
          const c = colorMap.get(id);
          const rgb = c ? getDisplayRgb(c) : fallbackRgb;
          return {
            name: c?.name ?? `Color ${id}`,
            rgb,
            hex: rgbToHex(rgb),
            id,
          };
        });
      return {
        slot: e.slot,
        skinName,
        skinIcon: skin?.icon,
        skinId: e.skinId,
        colors: colorEntries,
        showColors: true,
      };
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <ViewTracker templateId={template.id} templateUserId={template.user_id ?? null} />

      {/* Header strip: back (left) + actions (right) */}
      <header className="flex items-center justify-between gap-4 py-4">
        <Link href="/" className="link link-hover text-base-content/80">
          ← Back to Templates
        </Link>
        <TemplateActions
          templateId={template.id}
          slug={template.slug}
          isOwner={isOwner}
          isPrivate={template.is_private}
          variant="header"
        />
      </header>

      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-8">
        {/* Left: gallery (main + extra images) with favourite overlay, or placeholder */}
        <div className="relative">
          {template.image_url || (template.template_extra_images && template.template_extra_images.length > 0) ? (
            <TemplateExtraImagesGallery
              templateName={template.name}
              mainImageUrl={template.image_url}
              extraImages={template.template_extra_images ?? []}
            />
          ) : (
            <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden ring-1 ring-base-300 shadow-lg bg-base-200">
              <div className="w-full h-full flex items-center justify-center text-base-content/30">
                <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
          <div className="absolute top-3 left-3 z-10">
            <FavouriteButton
              templateId={template.id}
              favouriteCount={template.favourite_count ?? 0}
              isFavourited={isFavourited}
              variant="detail"
            />
          </div>
        </div>

        {/* Right: title, author, description, tags, fashion code, stats */}
        <div className="min-w-0 flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold">{template.name}</h1>
            <span className="badge badge-primary badge-lg capitalize">
              {template.armor_type}
            </span>
          </div>
          {template.users && (
            <p className="text-base text-base-content/60 mt-1">
              by{" "}
              <Link href={`/profile/${template.users.username.toLowerCase()}`} className="link link-primary">
                {template.users.username}
              </Link>
            </p>
          )}

          {(template.description || tagNames.length > 0) && (
            <div className="mt-4 space-y-3">
              {template.description && (
                <p className="text-base-content/80 whitespace-pre-line">{template.description}</p>
              )}
              {tagNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tagNames.map((tag, index) => (
                    <span key={index} className="badge badge-outline">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <TemplateDetailClient
              templateId={template.id}
              fashionCode={template.fashion_code}
              templateUserId={template.user_id ?? null}
              skinsAndColors={skinsAndColors}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-base-300 text-sm text-base-content/60">
            <span>{template.view_count.toLocaleString()} views</span>
            <span className="mx-2">·</span>
            <span>{template.copy_count.toLocaleString()} copies</span>
            <span className="mx-2">·</span>
            <span>{(template.favourite_count ?? 0).toLocaleString()} favourites</span>
          </div>
        </div>
      </div>
    </div>
  );
}

