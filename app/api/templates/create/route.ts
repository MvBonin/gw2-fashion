import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateTemplateSlug } from "@/lib/utils/slug";

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
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, fashion_code, armor_type, description, tags } = body;

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

    // Create template
    const { data: template, error: createError } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        name: name.trim(),
        slug,
        fashion_code: fashion_code.trim(),
        armor_type,
        description: description?.trim() || null,
        tags: tags && Array.isArray(tags) && tags.length > 0 ? tags : null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating template:", createError);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
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

