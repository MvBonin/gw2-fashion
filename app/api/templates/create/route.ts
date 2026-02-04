import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateTemplateSlug } from "@/lib/utils/slug";
import { getOrCreateTagIds, normalizeTagName } from "@/lib/utils/tags";
import type { Database } from "@/types/database.types";

type UserUsername = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "username"
>;
type TemplatesInsert = Database["public"]["Tables"]["templates"]["Insert"];
type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication (session from cookies; middleware already ran without profile fetch)
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

    // Generate slug (single roundtrip)
    const slug = await generateTemplateSlug(supabase, profile.username, name.trim());

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

    // Get-or-create tags and link via template_tags (batch)
    const tagNames =
      Array.isArray(tags) && tags.length > 0
        ? [...new Set(tags.map((t: unknown) => (typeof t === "string" ? normalizeTagName(t) : "")).filter(Boolean))]
        : [];
    const tagIdMap = await getOrCreateTagIds(supabase, tagNames);
    const templateTagRows = tagNames
      .map((name) => ({ template_id: template.id, tag_id: tagIdMap.get(name) }))
      .filter((row): row is { template_id: string; tag_id: string } => row.tag_id != null);
    if (templateTagRows.length > 0) {
      await supabase.from("template_tags").insert(templateTagRows);
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

