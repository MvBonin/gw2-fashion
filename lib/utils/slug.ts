import { createClient } from "@/lib/supabase/server";

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
 * Generates a unique slug for a template
 * Format: {username}-{template-name-slugified}-{number-if-needed}
 */
export async function generateTemplateSlug(
  username: string,
  templateName: string
): Promise<string> {
  const supabase = await createClient();
  const usernameSlug = slugify(username);
  const templateSlug = slugify(templateName);
  const baseSlug = `${usernameSlug}-${templateSlug}`;

  // Check if slug exists
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from("templates")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // Error other than "not found"
      throw new Error(`Error checking slug: ${error.message}`);
    }

    if (!data) {
      // Slug doesn't exist, we can use it
      return slug;
    }

    // Slug exists, try with number
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

