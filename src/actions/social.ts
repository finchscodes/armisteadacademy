"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { socialFollows, threads } from "@/db/schema";
import { requireSessionAndCharacter } from "@/lib/session-character";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function toggleFollowAction(formData: FormData) {
  const { characterId } = await requireSessionAndCharacter();
  const threadId = Number(formData.get("threadId"));
  if (!threadId) return;

  const [thread] = await db.select({ slug: threads.slug }).from(threads).where(eq(threads.id, threadId));
  if (!thread) return;

  const [existing] = await db
    .select({ id: socialFollows.id })
    .from(socialFollows)
    .where(and(eq(socialFollows.followerCharacterId, characterId), eq(socialFollows.followedThreadId, threadId)));

  if (existing) {
    await db.delete(socialFollows).where(eq(socialFollows.id, existing.id));
  } else {
    await db.insert(socialFollows).values({ followerCharacterId: characterId, followedThreadId: threadId });
  }

  revalidatePath(`/t/${thread.slug}`);
}

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const BUCKET = "faceclaims"; // reusing the existing bucket, just a different path prefix — avoids requiring a new bucket to be provisioned in Supabase

export type UploadResult = { url?: string; error?: string };

export async function uploadSocialPostImageAction(formData: FormData): Promise<UploadResult> {
  const { session } = await requireSessionAndCharacter();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file provided" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Use a PNG, JPG, GIF, or WEBP image" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be under 25MB" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.type.split("/")[1];
  const path = `social/${session.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

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
