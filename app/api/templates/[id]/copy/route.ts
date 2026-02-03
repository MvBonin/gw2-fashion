import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database.types";

type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type TemplatesUpdate = Database["public"]["Tables"]["templates"]["Update"];
type TemplateCopyCountRow = Pick<TemplateRow, "copy_count" | "user_id">;

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
      .select("copy_count, user_id")
      .eq("id", id)
      .single();

    const template: TemplateCopyCountRow | null = data as TemplateCopyCountRow | null;
    if (fetchError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (user?.id === template.user_id) {
      return NextResponse.json({ success: true });
    }

    // Supabase client infers rpc() second arg as undefined; Database.Functions is correct
    const { error } = await supabase.rpc("increment_copy_count", {
      template_id: id,
    });

    if (error) {
      const updatePayload: TemplatesUpdate = {
        copy_count: template.copy_count + 1,
      };
      const { error: updateError } = await supabase
        .from("templates")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) {
        console.error("Error incrementing copy count:", updateError);
        return NextResponse.json(
          { error: "Failed to track copy" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in copy tracking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

