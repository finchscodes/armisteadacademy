import { db } from "@/db";
import { wallPosts } from "@/db/schema";

/**
 * Posts an automatic entry (sorted into a hall, leveled up) to a
 * character's own wall, from that character to themselves — same wall
 * everyone already sees on their profile, not a separate area. Content is
 * still stored as a plain-text fallback sentence, but activityType/Value
 * are what the UI actually keys off to render this as a distinct
 * activity-feed badge instead of a normal wall post — see WallPostItem.
 */
async function postActivityEntry(
  characterId: number,
  activityType: "level_up" | "sorted",
  activityValue: string,
  fallbackText: string
): Promise<void> {
  await db.insert(wallPosts).values({
    wallCharacterId: characterId,
    posterCharacterId: characterId,
    content: `<p>${fallbackText}</p>`,
    activityType,
    activityValue,
  });
}

export async function postLevelUpEntry(characterId: number, newLevel: number): Promise<void> {
  await postActivityEntry(characterId, "level_up", String(newLevel), `Reached Level ${newLevel}!`);
}

export async function postSortedEntry(characterId: number, hallLabel: string, hallValue: string): Promise<void> {
  await postActivityEntry(characterId, "sorted", hallValue, `Sorted into ${hallLabel} hall!`);
}
