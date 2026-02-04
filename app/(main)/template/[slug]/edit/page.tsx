import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import Link from "next/link";
import TemplateEditForm from "@/components/templates/TemplateEditForm";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Edit Template | GW2 Fashion",
  description: "Edit your Guild Wars 2 fashion template.",
  robots: { index: false },
};

type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type TemplateWithTags = Pick<
  TemplateRow,
  "id" | "user_id" | "name" | "slug" | "fashion_code" | "armor_type" | "description" | "image_url" | "is_private"
> & {
  template_tags?: { tags: { name: string } | null }[] | null;
  template_extra_images?: { position: number; image_url: string }[] | null;
};

interface EditPageProps {
  params: Promise<{ slug: string }>;
}

function templateTagsToNames(tt: TemplateWithTags["template_tags"]): string[] {
  return (tt ?? []).map((x) => x.tags?.name).filter(Boolean) as string[];
}

export default async function TemplateEditPage({ params }: EditPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("templates")
    .select(
      "id, user_id, name, slug, fashion_code, armor_type, description, image_url, is_private, template_tags(tags(name)), template_extra_images(position, image_url)"
    )
    .eq("slug", slug)
    .eq("active", true)
    .single();

  const template = data as TemplateWithTags | null;

  if (error || !template) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.id !== template.user_id) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/template/${slug}`} className="btn btn-ghost btn-sm">
          ← Back to Template
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-8">Edit Template</h1>
      <TemplateEditForm
        templateId={template.id}
        slug={template.slug}
        initialName={template.name}
        initialFashionCode={template.fashion_code}
        initialArmorType={template.armor_type as "light" | "medium" | "heavy"}
        initialDescription={template.description ?? ""}
        initialTags={templateTagsToNames(template.template_tags)}
        initialImageUrl={template.image_url ?? null}
        initialIsPrivate={template.is_private}
        initialExtraImages={
          template.template_extra_images?.map((e) => ({
            position: e.position,
            image_url: e.image_url,
          })) ?? []
        }
      />
    </div>
  );
}
