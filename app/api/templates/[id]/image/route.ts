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
type TemplatesUpdate = Database["public"]["Tables"]["templates"]["Update"];

const BUCKET = "template-images";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB (compression runs server-side)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

interface RouteParams {
  params: Promise<{ id: string }>;
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

    // Client mit User-JWT für Storage, damit RLS (auth.uid()) greift
    const storageClient = createClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      }
    );

    const { data, error: fetchError } = await supabase
      .from("templates")
      .select("id, user_id")
      .eq("id", templateId)
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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
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

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let buffer: Buffer;
    let mime: string;
    let ext: string;
    try {
      const result = await compressScreenshotLosslessWebp(fileBuffer, file.name);
      buffer = result.buffer;
      mime = result.mime;
      ext = result.ext;
    } catch (err) {
      console.error("Image processing failed:", err);
      return NextResponse.json(
        { error: "Image processing failed" },
        { status: 500 }
      );
    }

    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `${user.id}/${templateId}/${filename}`;

    const { error: uploadError } = await storageClient.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mime,
        upsert: true,
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

    const updatePayload: TemplatesUpdate = { image_url: publicUrl };
    const { error: updateError } = await supabase
      .from("templates")
      .update(updatePayload)
      .eq("id", templateId);

    if (updateError) {
      console.error("Error updating template image_url:", updateError);
      return NextResponse.json(
        { error: "Failed to save image URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ image_url: publicUrl });
  } catch (error) {
    console.error("Error in template image upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
