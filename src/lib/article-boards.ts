import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardPostPermissions } from "@/db/schema";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";

/**
 * Can this character post a new article to this board? Management-job
 * holders (Head Staff and up) always can; anyone else needs an explicit
 * admin grant for this specific board. Admin bypass is checked by the caller.
 */
export async function canPostArticle(characterId: number, boardId: number): Promise<boolean> {
  const isManagement = await characterHasAnyJob(characterId, MANAGEMENT_JOBS);
  if (isManagement) return true;

  const [granted] = await db
    .select({ id: boardPostPermissions.id })
    .from(boardPostPermissions)
    .where(
      and(
        eq(boardPostPermissions.characterId, characterId),
        eq(boardPostPermissions.boardId, boardId)
      )
    );
  return Boolean(granted);
}

/**
 * Can this character edit ANY topic post (not just their own)? Management
 * and Enforcers get this moderation-style capability. Admin bypass and
 * post-author checks are handled by the caller.
 */
export async function canModeratePosts(characterId: number): Promise<boolean> {
  return characterHasAnyJob(characterId, [...MANAGEMENT_JOBS, "enforcer"]);
}
