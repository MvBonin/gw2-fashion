import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { compressScreenshotLosslessWebp } from "@/lib/utils/smartCompressImage";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database.types";

type TemplateIdUser = Pick<
  Database["public"]["Tables"]["templates"]["Row"],
  "id" | "user_id"
>;
type TemplateExtraImagesInsert =
  Database["public"]["Tables"]["template_extra_images"]["Insert"];
type TemplateExtraImagesRow =
  Database["public"]["Tables"]["template_extra_images"]["Row"];

const BUCKET = "template-images";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB upload limit
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

const VALID_POSITIONS = [1, 2, 3] as const;

// Always output WebP lossless for screenshots
const OUTPUT_MIME = "image/webp";
const OUTPUT_EXT = "webp";

// Resize to fit within this box (keeps screenshots crisp, reduces filesize)
const MAX_WIDTH_OR_HEIGHT = 2560;

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  const prefix = "/object/public/" + BUCKET + "/";
  const i = publicUrl.indexOf(prefix);
  if (i === -1) return null;
  return publicUrl.slice(i + prefix.length);
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: templateId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storageClient = createClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      }
    );

    const { data: template, error: fetchError } = await supabase
      .from("templates")
      .select("id, user_id")
      .eq("id", templateId)
      .single();

    const t = template as TemplateIdUser | null;
    if (fetchError || !t) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (user.id !== t.user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const positionParam = formData.get("position");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const position = positionParam != null ? Number(positionParam) : NaN;
    if (
      !Number.isInteger(position) ||
      !VALID_POSITIONS.includes(position as (typeof VALID_POSITIONS)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid position. Use 1, 2 or 3." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, WebP or AVIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // ---- Always convert to WebP lossless & fit inside MAX_WIDTH_OR_HEIGHT ----
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    let buffer: Buffer;
    try {
      const result = await compressScreenshotLosslessWebp(
        fileBuffer,
        file.name,
        { maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT, effort: 6 }
      );
      buffer = result.buffer;
    } catch (err) {
      console.error("Image processing failed:", err);
      return NextResponse.json(
        { error: "Image processing failed" },
        { status: 500 }
      );
    }
    // ------------------------------------------------------------------------

    // If slot already has an image, remove old file from storage before uploading new one
    const { data: existingRow } = await supabase
      .from("template_extra_images")
      .select("image_url")
      .eq("template_id", templateId)
      .eq("position", position)
      .maybeSingle();

    const existing = existingRow as { image_url: string } | null;
    if (existing?.image_url) {
      const oldPath = getStoragePathFromPublicUrl(existing.image_url);
      if (oldPath) {
        await storageClient.storage.from(BUCKET).remove([oldPath]);
      }
    }

    const filename = `extra_${position}_${crypto.randomUUID()}.${OUTPUT_EXT}`;
    const path = `${user.id}/${templateId}/${filename}`;

    const { error: uploadError } = await storageClient.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: OUTPUT_MIME,
        upsert: true,
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = storageClient.storage.from(BUCKET).getPublicUrl(path);

    const row: TemplateExtraImagesInsert = {
      template_id: templateId,
      position,
      image_url: publicUrl,
    };

    const { error: upsertError } = await supabase
      .from("template_extra_images")
      .upsert(row, {
        onConflict: "template_id,position",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error("Error upserting template_extra_images:", upsertError);
      return NextResponse.json(
        { error: "Failed to save image URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ image_url: publicUrl });
  } catch (error) {
    console.error("Error in template extra image upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: templateId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const storageClient = createClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      }
    );

    const { data: template, error: fetchError } = await supabase
      .from("templates")
      .select("id, user_id")
      .eq("id", templateId)
      .single();

    const t = template as TemplateIdUser | null;
    if (fetchError || !t) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (user.id !== t.user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const positionParam = searchParams.get("position");
    const position = positionParam != null ? Number(positionParam) : NaN;
    if (
      !Number.isInteger(position) ||
      !VALID_POSITIONS.includes(position as (typeof VALID_POSITIONS)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid position. Use 1, 2 or 3." },
        { status: 400 }
      );
    }

    const { data: existing, error: selectError } = await supabase
      .from("template_extra_images")
      .select("id, image_url")
      .eq("template_id", templateId)
      .eq("position", position)
      .maybeSingle();

    const row = existing as TemplateExtraImagesRow | null;
    if (selectError || !row) {
      return NextResponse.json(
        { error: "Extra image not found" },
        { status: 404 }
      );
    }

    const storagePath = getStoragePathFromPublicUrl(row.image_url);
    if (storagePath) {
      await storageClient.storage.from(BUCKET).remove([storagePath]);
    }

    const { error: deleteError } = await supabase
      .from("template_extra_images")
      .delete()
      .eq("template_id", templateId)
      .eq("position", position);

    if (deleteError) {
      console.error("Error deleting template_extra_images row:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in template extra image delete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
