import { eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";

/** A character counts as online if their heartbeat landed within this window. */
export const ONLINE_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

export async function markCharacterActive(characterId: number) {
  await db.update(characters).set({ lastActiveAt: new Date() }).where(eq(characters.id, characterId));
}

/** Every character active within the online window. */
export async function getOnlineCharacters() {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  return db
    .select({
      id: characters.id,
      firstName: characters.firstName,
      lastName: characters.lastName,
      name: characters.name,
      slug: characters.slug,
      avatarUrl: characters.avatarUrl,
    })
    .from(characters)
    .where(gt(characters.lastActiveAt, cutoff));
}
