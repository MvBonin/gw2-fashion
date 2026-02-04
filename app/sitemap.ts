import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const [{ data: templates }, { data: users }] = await Promise.all([
    supabase
      .from("templates")
      .select("slug, updated_at")
      .eq("active", true),
    supabase.from("users").select("username"),
  ]);

  const templateEntries: MetadataRoute.Sitemap = (templates ?? []).map(
    (t) => ({
      url: `${baseUrl}/template/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  );

  const profileEntries: MetadataRoute.Sitemap = (users ?? []).map((u) => ({
    url: `${baseUrl}/profile/${encodeURIComponent(u.username)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...templateEntries, ...profileEntries];
}
