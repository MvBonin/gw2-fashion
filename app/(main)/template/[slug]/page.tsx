import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import TemplateDetailClient from "@/components/templates/TemplateDetailClient";

interface TemplateDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TemplateDetailPage({
  params,
}: TemplateDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Load template with user info
  const { data: template, error } = await supabase
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
      tags,
      view_count,
      copy_count,
      created_at,
      users(id, username)
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !template) {
    notFound();
  }

  // Track view (fire and forget, don't wait for it)
  // Use server-side increment directly for better performance
  supabase
    .from("templates")
    .update({ view_count: template.view_count + 1 })
    .eq("id", template.id)
    .then()
    .catch((err) => console.error("Error tracking view:", err));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="btn btn-ghost btn-sm">
          ← Back to Templates
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative w-full aspect-square bg-base-200 rounded-lg overflow-hidden">
          {template.image_url ? (
            <Image
              src={template.image_url}
              alt={template.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-base-content/30">
              <svg
                className="w-48 h-48"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-4xl font-bold">{template.name}</h1>
            <span className="badge badge-primary badge-lg capitalize">
              {template.armor_type}
            </span>
          </div>

          {template.users && (
            <p className="text-lg text-base-content/70 mb-4">
              by{" "}
              <Link
                href={`/profile/${template.users.username.toLowerCase()}`}
                className="link link-primary"
              >
                {template.users.username}
              </Link>
            </p>
          )}

          {template.description && (
            <p className="text-base-content/80 mb-6">{template.description}</p>
          )}

          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {template.tags.map((tag, index) => (
                <span key={index} className="badge badge-outline">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="stats shadow mb-6">
            <div className="stat">
              <div className="stat-title">Views</div>
              <div className="stat-value text-primary">
                {template.view_count.toLocaleString()}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Copies</div>
              <div className="stat-value text-secondary">
                {template.copy_count.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Fashion Code */}
          <TemplateDetailClient
            templateId={template.id}
            fashionCode={template.fashion_code}
          />
        </div>
      </div>
    </div>
  );
}

