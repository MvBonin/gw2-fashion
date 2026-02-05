import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { normalizeTagName, isValidTagName } from "@/lib/utils/tags";

const MAX_TAGS_PER_TEMPLATE = 20;
import type { Database } from "@/types/database.types";

type TemplateIdUser = Pick<
  Database["public"]["Tables"]["templates"]["Row"],
  "id" | "user_id"
>;
type TemplatesUpdate = Database["public"]["Tables"]["templates"]["Update"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error: fetchError } = await supabase
      .from("templates")
      .select("id, user_id")
      .eq("id", id)
      .single();

    const template: TemplateIdUser | null = data as TemplateIdUser | null;
    if (fetchError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (user.id !== template.user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, fashion_code, armor_type, description, tags, image_url, active, is_private } = body;

    // Soft delete: only set active = false
    if (active === false) {
      const { error: updateError } = await supabase
        .from("templates")
        .update({ active: false } as TemplatesUpdate)
        .eq("id", id);

      if (updateError) {
        console.error("Error soft-deleting template:", updateError);
        return NextResponse.json(
          { error: "Failed to delete template" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    // Edit: validate and update fields (slug and user_id stay unchanged)
    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length < 3) {
        return NextResponse.json(
          { error: "Template name must be at least 3 characters" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (fashion_code !== undefined) {
      if (!fashion_code || typeof fashion_code !== "string" || fashion_code.trim().length === 0) {
        return NextResponse.json(
          { error: "Fashion code is required" },
          { status: 400 }
        );
      }
      updates.fashion_code = fashion_code.trim();
    }

    if (armor_type !== undefined) {
      if (
        armor_type !== "light" &&
        armor_type !== "medium" &&
        armor_type !== "heavy"
      ) {
        return NextResponse.json(
          { error: "Invalid armor type. Must be light, medium, or heavy" },
          { status: 400 }
        );
      }
      updates.armor_type = armor_type;
    }

    if (description !== undefined) {
      updates.description =
        typeof description === "string" && description.trim().length > 0
          ? description.trim()
          : null;
    }

    if (image_url !== undefined) {
      updates.image_url =
        typeof image_url === "string" && image_url.trim().length > 0
          ? image_url.trim()
          : null;
    }

    if (is_private !== undefined) {
      updates.is_private = Boolean(is_private);
    }

    // Update template fields if any
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("templates")
        .update(updates as TemplatesUpdate)
        .eq("id", id);

      if (updateError) {
        console.error("Error updating template:", updateError);
        return NextResponse.json(
          { error: "Failed to update template" },
          { status: 500 }
        );
      }
    }

    // Sync tags via single RPC (one roundtrip, one transaction)
    if (tags !== undefined) {
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

      if (tagNames.length > MAX_TAGS_PER_TEMPLATE) {
        return NextResponse.json(
          { error: `At most ${MAX_TAGS_PER_TEMPLATE} tags allowed` },
          { status: 400 }
        );
      }

      const { error: rpcError } = await supabase.rpc("update_template_tags", {
        p_template_id: id,
        p_tag_names: tagNames,
      });

      if (rpcError) {
        const msg = rpcError.message ?? "Failed to save tags";
        console.error("Error in update_template_tags:", rpcError);
        if (msg.includes("Unauthorized")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (msg.includes("Forbidden")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in template PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
