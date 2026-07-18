import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { wallPosts, wallPostLikes, wallPostComments, characters } from "@/db/schema";
import { getPrimaryJobsForCharacters } from "@/lib/character-jobs";
import type { CharacterJob } from "@/lib/roles";

export type WallLikeSummary = { count: number; likedByViewer: boolean };

/** Like counts per wall post, with whether the viewer's active character liked it. */
export async function getLikesForWallPosts(
  wallPostIds: number[],
  viewerCharacterId: number | null
): Promise<Map<number, WallLikeSummary>> {
  if (wallPostIds.length === 0) return new Map();

  const rows = await db
    .select({ wallPostId: wallPostLikes.wallPostId, characterId: wallPostLikes.characterId })
    .from(wallPostLikes)
    .where(inArray(wallPostLikes.wallPostId, wallPostIds));

  const map = new Map<number, WallLikeSummary>();
  for (const row of rows) {
    const existing = map.get(row.wallPostId) ?? { count: 0, likedByViewer: false };
    existing.count += 1;
    if (viewerCharacterId && row.characterId === viewerCharacterId) existing.likedByViewer = true;
    map.set(row.wallPostId, existing);
  }
  return map;
}

export type WallCommentRow = {
  id: number;
  wallPostId: number;
  content: string;
  createdAt: Date;
  characterId: number;
  characterName: string;
  characterFirstName: string;
  characterLastName: string;
  characterSlug: string;
  characterAvatarUrl: string | null;
  characterJob: CharacterJob;
};

export async function getCommentsForWallPosts(wallPostIds: number[]): Promise<Map<number, WallCommentRow[]>> {
  if (wallPostIds.length === 0) return new Map();

  const rows = await db
    .select({
      id: wallPostComments.id,
      wallPostId: wallPostComments.wallPostId,
      content: wallPostComments.content,
      createdAt: wallPostComments.createdAt,
      characterId: characters.id,
      characterName: characters.name,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterSlug: characters.slug,
      characterAvatarUrl: characters.avatarUrl,
    })
    .from(wallPostComments)
    .innerJoin(characters, eq(wallPostComments.characterId, characters.id))
    .where(inArray(wallPostComments.wallPostId, wallPostIds))
    .orderBy(wallPostComments.createdAt);

  const map = new Map<number, WallCommentRow[]>();
  const jobsByCharacter = await getPrimaryJobsForCharacters([...new Set(rows.map((r) => r.characterId))]);
  for (const row of rows) {
    if (!map.has(row.wallPostId)) map.set(row.wallPostId, []);
    map.get(row.wallPostId)!.push({ ...row, characterJob: jobsByCharacter.get(row.characterId) ?? "none" });
  }
  return map;
}

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
      activityType: wallPosts.activityType,
      activityValue: wallPosts.activityValue,
    })
    .from(wallPosts)
    .innerJoin(characters, eq(wallPosts.posterCharacterId, characters.id))
    .where(eq(wallPosts.wallCharacterId, wallCharacterId))
    .orderBy(desc(wallPosts.isPinned), desc(wallPosts.createdAt));

  const jobsByCharacter = await getPrimaryJobsForCharacters(rows.map((r) => r.posterCharacterId));
  return rows.map((r) => ({ ...r, posterJob: jobsByCharacter.get(r.posterCharacterId) ?? "none" }));
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
      activityType: wallPosts.activityType,
      activityValue: wallPosts.activityValue,
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
  const jobsByCharacter = await getPrimaryJobsForCharacters(characterIds);
  const byId = new Map(
    characterRows.map((c) => [c.id, { ...c, job: jobsByCharacter.get(c.id) ?? "none" }])
  );

  return rows
    .map((r) => ({
      ...r,
      poster: byId.get(r.posterCharacterId),
      wallOwner: byId.get(r.wallCharacterId),
    }))
    .filter((r) => r.poster && r.wallOwner);
}
