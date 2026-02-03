import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST: Set terms_accepted_at for the current user (e.g. when they only need to accept ToS on welcome).
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating terms_accepted_at:", updateError);
      return NextResponse.json(
        { error: "Failed to record terms acceptance" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("accept-terms error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
