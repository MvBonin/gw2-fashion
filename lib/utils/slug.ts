import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Converts a string to a URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generates a unique slug for a template (single DB roundtrip).
 * Format: {username}-{template-name-slugified}-{number-if-needed}
 */
export async function generateTemplateSlug(
  supabase: SupabaseClient<Database>,
  username: string,
  templateName: string
): Promise<string> {
  const usernameSlug = slugify(username);
  const templateSlug = slugify(templateName);
  const baseSlug = `${usernameSlug}-${templateSlug}`;

  const { data: existingSlugs, error } = await supabase
    .from("templates")
    .select("slug")
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);

  if (error) {
    throw new Error(`Error checking slug: ${error.message}`);
  }

  const slugs = (existingSlugs ?? []).map((row) => row.slug);
  if (slugs.length === 0) {
    return baseSlug;
  }

  const hasBase = slugs.includes(baseSlug);
  let maxNum = 0;
  const prefix = `${baseSlug}-`;
  for (const slug of slugs) {
    if (slug === baseSlug) {
      maxNum = Math.max(maxNum, 1);
    } else if (slug.startsWith(prefix)) {
      const n = parseInt(slug.slice(prefix.length), 10);
      if (!Number.isNaN(n)) {
        maxNum = Math.max(maxNum, n);
      }
    }
  }

  return maxNum === 0 && !hasBase ? baseSlug : `${baseSlug}-${maxNum + 1}`;
}

