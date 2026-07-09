import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { postReactions, postComments, characters } from "@/db/schema";

export type ReactionSummary = { emoji: string; count: number; reactedByViewer: boolean };

/** Reaction counts per post, per emoji, with whether the viewer's active character reacted. */
export async function getReactionsForPosts(
  postIds: number[],
  viewerCharacterId: number | null
): Promise<Map<number, ReactionSummary[]>> {
  if (postIds.length === 0) return new Map();

  const rows = await db
    .select({
      postId: postReactions.postId,
      emoji: postReactions.emoji,
      characterId: postReactions.characterId,
    })
    .from(postReactions)
    .where(inArray(postReactions.postId, postIds));

  const byPost = new Map<number, Map<string, ReactionSummary>>();
  for (const row of rows) {
    if (!byPost.has(row.postId)) byPost.set(row.postId, new Map());
    const emojiMap = byPost.get(row.postId)!;
    const existing = emojiMap.get(row.emoji) ?? { emoji: row.emoji, count: 0, reactedByViewer: false };
    existing.count += 1;
    if (viewerCharacterId && row.characterId === viewerCharacterId) existing.reactedByViewer = true;
    emojiMap.set(row.emoji, existing);
  }

  const result = new Map<number, ReactionSummary[]>();
  for (const [postId, emojiMap] of byPost) {
    result.set(postId, [...emojiMap.values()]);
  }
  return result;
}

export type PostCommentRow = {
  id: number;
  postId: number;
  content: string;
  createdAt: Date;
  characterId: number;
  characterName: string;
  characterFirstName: string;
  characterLastName: string;
  characterSlug: string;
  characterAvatarUrl: string | null;
};

export async function getCommentsForPosts(postIds: number[]): Promise<Map<number, PostCommentRow[]>> {
  if (postIds.length === 0) return new Map();

  const rows = await db
    .select({
      id: postComments.id,
      postId: postComments.postId,
      content: postComments.content,
      createdAt: postComments.createdAt,
      characterId: characters.id,
      characterName: characters.name,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterSlug: characters.slug,
      characterAvatarUrl: characters.avatarUrl,
    })
    .from(postComments)
    .innerJoin(characters, eq(postComments.characterId, characters.id))
    .where(inArray(postComments.postId, postIds))
    .orderBy(postComments.createdAt);

  const map = new Map<number, PostCommentRow[]>();
  for (const row of rows) {
    if (!map.has(row.postId)) map.set(row.postId, []);
    map.get(row.postId)!.push(row);
  }
  return map;
}
