import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database.types";

type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type TemplateViewRow = Pick<TemplateRow, "view_count" | "user_id">;
type TemplatesUpdate = Database["public"]["Tables"]["templates"]["Update"];

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: fetchError } = await supabase
      .from("templates")
      .select("view_count, user_id")
      .eq("id", id)
      .single();

    const template: TemplateViewRow | null = data as TemplateViewRow | null;
    if (fetchError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (user?.id === template.user_id) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.rpc("increment_view_count", {
      template_id: id,
    });

    if (error) {
      const updatePayload: TemplatesUpdate = {
        view_count: template.view_count + 1,
      };
      const { error: updateError } = await supabase
        .from("templates")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) {
        console.error("Error incrementing view count:", updateError);
        return NextResponse.json(
          { error: "Failed to track view" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in view tracking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

