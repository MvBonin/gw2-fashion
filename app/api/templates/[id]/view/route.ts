import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    // Increment view_count
    const { error } = await supabase.rpc("increment_view_count", {
      template_id: id,
    });

    if (error) {
      // Fallback: direct update if RPC doesn't exist
      const { data: template } = await supabase
        .from("templates")
        .select("view_count")
        .eq("id", id)
        .single();

      if (template) {
        const { error: updateError } = await supabase
          .from("templates")
          .update({ view_count: template.view_count + 1 })
          .eq("id", id);

        if (updateError) {
          console.error("Error incrementing view count:", updateError);
          return NextResponse.json(
            { error: "Failed to track view" },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
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

