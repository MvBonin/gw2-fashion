import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: templateId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to favourite templates" },
        { status: 401 }
      );
    }

    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("id, active, favourite_count")
      .eq("id", templateId)
      .single();

    if (templateError || !template || !template.active) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const { data: existing } = await supabase
      .from("template_favourites")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("template_id", templateId)
      .maybeSingle();

    if (existing) {
      const { error: deleteError } = await supabase
        .from("template_favourites")
        .delete()
        .eq("user_id", user.id)
        .eq("template_id", templateId);

      if (deleteError) {
        console.error("Error removing favourite:", deleteError);
        return NextResponse.json(
          { error: "Failed to remove favourite" },
          { status: 500 }
        );
      }
      const newCount = Math.max(0, (template.favourite_count ?? 0) - 1);
      return NextResponse.json({
        favourited: false,
        favourite_count: newCount,
      });
    }

    const { error: insertError } = await supabase
      .from("template_favourites")
      .insert({ user_id: user.id, template_id: templateId });

    if (insertError) {
      console.error("Error adding favourite:", insertError);
      return NextResponse.json(
        { error: "Failed to add favourite" },
        { status: 500 }
      );
    }

    const newCount = (template.favourite_count ?? 0) + 1;
    return NextResponse.json({
      favourited: true,
      favourite_count: newCount,
    });
  } catch (error) {
    console.error("Error in favourite toggle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
