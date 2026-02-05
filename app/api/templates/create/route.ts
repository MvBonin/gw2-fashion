import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { normalizeTagName, isValidTagName } from "@/lib/utils/tags";
import type { Database } from "@/types/database.types";

export async function POST(request: Request) {
  const t0 = Date.now();
  try {
    const supabase = await createClient();
    console.log("[create] createClient:", Date.now() - t0, "ms");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("[create] getUser:", Date.now() - t0, "ms");

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("[create] request.json:", Date.now() - t0, "ms");
    const { name, fashion_code, armor_type, description, tags, is_private } = body;

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

    const tagNames =
      Array.isArray(tags) && tags.length > 0
        ? [
            ...new Set(
              tags
                .filter((t: unknown) => typeof t === "string" && isValidTagName(t as string))
                .map((t: string) => normalizeTagName(t))
            ),
          ]
        : [];

    const MAX_TAGS_PER_TEMPLATE = 20;
    if (tagNames.length > MAX_TAGS_PER_TEMPLATE) {
      return NextResponse.json(
        { error: `At most ${MAX_TAGS_PER_TEMPLATE} tags allowed` },
        { status: 400 }
      );
    }

    const { data: rows, error: rpcError } = await supabase.rpc("create_template_with_tags", {
      p_user_id: user.id,
      p_name: name.trim(),
      p_fashion_code: fashion_code.trim(),
      p_armor_type: armor_type,
      p_description: description != null && typeof description === "string" ? description.trim() || null : null,
      p_is_private: Boolean(is_private),
      p_tag_names: tagNames,
    });

    console.log("[create] create_template_with_tags RPC:", Date.now() - t0, "ms");

    if (rpcError) {
      const msg = rpcError.message ?? "Failed to create template";
      if (rpcError.code === "PGRST301" || msg.includes("User profile not found")) {
        return NextResponse.json({ error: "User profile not found" }, { status: 404 });
      }
      if (msg.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      console.error("Error in create_template_with_tags:", rpcError);
      return NextResponse.json(
        { error: msg },
        { status: 500 }
      );
    }

    const row = (Array.isArray(rows) ? rows[0] : rows) as { id: string; slug: string } | undefined;
    if (!row?.id || !row?.slug) {
      console.error("create_template_with_tags returned no row:", rows);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    console.log("[create] total:", Date.now() - t0, "ms");
    return NextResponse.json({
      success: true,
      slug: row.slug,
      id: row.id,
    });
  } catch (error) {
    console.error("Error in template creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

