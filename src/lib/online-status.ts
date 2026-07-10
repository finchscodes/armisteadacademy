import { eq, gt, count } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getCharacterYearLabel } from "@/lib/year";

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

/** How many characters are online right now — cheap count for nav badges. */
export async function getOnlineCount(): Promise<number> {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  const [row] = await db
    .select({ total: count() })
    .from(characters)
    .where(gt(characters.lastActiveAt, cutoff));
  return row?.total ?? 0;
}

/** Online characters with the extra fields the /social page's table shows. */
export async function getOnlineCharactersDetailed() {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  const rows = await db
    .select({
      id: characters.id,
      firstName: characters.firstName,
      lastName: characters.lastName,
      name: characters.name,
      slug: characters.slug,
      avatarUrl: characters.avatarUrl,
      age: characters.age,
      major: characters.major,
      yearOverride: characters.yearOverride,
    })
    .from(characters)
    .where(gt(characters.lastActiveAt, cutoff));

  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      year: await getCharacterYearLabel(r.id, r.major, r.yearOverride),
    }))
  );
}
