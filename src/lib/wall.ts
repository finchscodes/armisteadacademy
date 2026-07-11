import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { wallPosts, characters } from "@/db/schema";

/** One character's wall — pinned post first, then newest first. */
export async function getWallPosts(wallCharacterId: number) {
  const rows = await db
    .select({
      id: wallPosts.id,
      content: wallPosts.content,
      isPinned: wallPosts.isPinned,
      createdAt: wallPosts.createdAt,
      posterCharacterId: characters.id,
      posterName: characters.name,
      posterFirstName: characters.firstName,
      posterLastName: characters.lastName,
      posterSlug: characters.slug,
      posterAvatarUrl: characters.avatarUrl,
    })
    .from(wallPosts)
    .innerJoin(characters, eq(wallPosts.posterCharacterId, characters.id))
    .where(eq(wallPosts.wallCharacterId, wallCharacterId))
    .orderBy(desc(wallPosts.isPinned), desc(wallPosts.createdAt));
  return rows;
}

/** Recent wall activity sitewide, for the homepage feed. */
export async function getRecentWallActivity(limit = 10) {
  const rows = await db
    .select({
      id: wallPosts.id,
      content: wallPosts.content,
      createdAt: wallPosts.createdAt,
      posterCharacterId: wallPosts.posterCharacterId,
      wallCharacterId: wallPosts.wallCharacterId,
    })
    .from(wallPosts)
    .orderBy(desc(wallPosts.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const characterIds = [...new Set(rows.flatMap((r) => [r.posterCharacterId, r.wallCharacterId]))];
  const characterRows = await db
    .select({
      id: characters.id,
      name: characters.name,
      firstName: characters.firstName,
      lastName: characters.lastName,
      slug: characters.slug,
      avatarUrl: characters.avatarUrl,
    })
    .from(characters)
    .where(inArray(characters.id, characterIds));
  const byId = new Map(characterRows.map((c) => [c.id, c]));

  return rows
    .map((r) => ({
      ...r,
      poster: byId.get(r.posterCharacterId),
      wallOwner: byId.get(r.wallCharacterId),
    }))
    .filter((r) => r.poster && r.wallOwner);
}
