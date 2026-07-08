"use server";

import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const BUCKET = "faceclaims";

export type UploadResult = { url?: string; error?: string };

export async function uploadFaceclaimAction(formData: FormData): Promise<UploadResult> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to upload an image" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file provided" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Use a PNG, JPG, GIF, or WEBP image" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be under 5MB" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.type.split("/")[1];
  const path = `${session.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { error: `Upload failed: ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
