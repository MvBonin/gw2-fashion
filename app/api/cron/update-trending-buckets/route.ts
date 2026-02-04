import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Cron endpoint: refreshes favourite_count_last_7d / _30d / _90d on templates
 * so trending_score (time-weighted likes) is up to date.
 * Call periodically (e.g. hourly). Secured by CRON_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("update_templates_favourite_buckets");
    if (error) {
      console.error("update_templates_favourite_buckets:", error);
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Cron update-trending-buckets:", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Unknown error",
        stack: e instanceof Error ? e.stack : undefined,
      },
      { status: 500 }
    );
  }
}
