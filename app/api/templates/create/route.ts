import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateTemplateSlug } from "@/lib/utils/slug";
import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserUsername = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "username"
>;
type TemplatesInsert = Database["public"]["Tables"]["templates"]["Insert"];
type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];

function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

async function getOrCreateTagId(
  supabase: SupabaseClient<Database>,
  name: string
): Promise<string | null> {
  const normalized = normalizeTagName(name);
  if (!normalized) return null;

  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("name", normalized)
    .single();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from("tags")
    .insert({ name: normalized })
    .select("id")
    .single();

  if (error || !inserted) return null;
  return inserted.id;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile for username
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();

    const profile: UserUsername | null = profileData as UserUsername | null;
    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, fashion_code, armor_type, description, tags, is_private } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Template name must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!fashion_code || typeof fashion_code !== "string" || fashion_code.trim().length === 0) {
      return NextResponse.json(
        { error: "Fashion code is required" },
        { status: 400 }
      );
    }

    if (
      !armor_type ||
      (armor_type !== "light" && armor_type !== "medium" && armor_type !== "heavy")
    ) {
      return NextResponse.json(
        { error: "Invalid armor type. Must be light, medium, or heavy" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = await generateTemplateSlug(profile.username, name.trim());

    // Create template (no tags column)
    const insertPayload: TemplatesInsert = {
      user_id: user.id,
      name: name.trim(),
      slug,
      fashion_code: fashion_code.trim(),
      armor_type,
      description: description?.trim() || null,
      is_private: Boolean(is_private),
    };
    const { data: templateData, error: createError } = await supabase
      .from("templates")
      .insert(insertPayload)
      .select()
      .single();

    const template: TemplateRow | null = templateData as TemplateRow | null;
    if (createError || !template) {
      console.error("Error creating template:", createError);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    // Get-or-create tags and link via template_tags
    const tagNames =
      Array.isArray(tags) && tags.length > 0
        ? [...new Set(tags.map((t: unknown) => (typeof t === "string" ? normalizeTagName(t) : "")).filter(Boolean))]
        : [];
    for (const tagName of tagNames) {
      const tagId = await getOrCreateTagId(supabase, tagName);
      if (tagId) {
        await supabase.from("template_tags").insert({
          template_id: template.id,
          tag_id: tagId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      slug: template.slug,
      id: template.id,
    });
  } catch (error) {
    console.error("Error in template creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

