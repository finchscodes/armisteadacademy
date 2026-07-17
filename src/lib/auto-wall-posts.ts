import { db } from "@/db";
import { wallPosts } from "@/db/schema";

/**
 * Posts an automatic entry (sorted into a hall, leveled up, ...) to a
 * character's own wall, from that character to themselves — same wall
 * everyone already sees on their profile, not a separate area.
 */
export async function postAutoWallEntry(characterId: number, content: string): Promise<void> {
  await db.insert(wallPosts).values({
    wallCharacterId: characterId,
    posterCharacterId: characterId,
    content: `<p>${content}</p>`,
  });
}
