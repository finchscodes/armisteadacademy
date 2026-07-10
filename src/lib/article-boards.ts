import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardPostPermissions, boards, characters } from "@/db/schema";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";

/**
 * Can this character even SEE a board? Only matters for hall-restricted
 * boards — everything else is open. Hall boards are exclusive to that
 * hall's own members; not even general management can see them (admin
 * bypass is checked by the caller).
 */
export async function canViewBoard(characterId: number, boardId: number): Promise<boolean> {
  const [board] = await db
    .select({ restrictedToHall: boards.restrictedToHall })
    .from(boards)
    .where(eq(boards.id, boardId));
  if (!board?.restrictedToHall) return true;

  const [character] = await db
    .select({ hall: characters.hall })
    .from(characters)
    .where(eq(characters.id, characterId));
  return character?.hall === board.restrictedToHall;
}

/**
 * Can this character post a new article to this board? Management-job
 * holders (Head Staff and up) always can. Some boards also auto-permit one
 * extra job (e.g. Writers on Armistead Weekly — see boards.extraArticleJob).
 * Anyone else needs an explicit admin grant for this specific board. Admin
 * bypass is checked by the caller.
 *
 * Hall boards add an extra requirement on top of all of this: the poster
 * must belong to that hall too — a Head Staff member from another hall
 * still can't post into a hall board that isn't theirs.
 */
export async function canPostArticle(characterId: number, boardId: number): Promise<boolean> {
  const [board] = await db
    .select({ extraArticleJob: boards.extraArticleJob, restrictedToHall: boards.restrictedToHall })
    .from(boards)
    .where(eq(boards.id, boardId));

  if (board?.restrictedToHall) {
    const [character] = await db
      .select({ hall: characters.hall })
      .from(characters)
      .where(eq(characters.id, characterId));
    if (character?.hall !== board.restrictedToHall) return false;
  }

  const isManagement = await characterHasAnyJob(characterId, MANAGEMENT_JOBS);
  if (isManagement) return true;

  if (board?.extraArticleJob && (await characterHasAnyJob(characterId, [board.extraArticleJob]))) {
    return true;
  }

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
