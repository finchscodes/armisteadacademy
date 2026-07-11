import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { classAssignments } from "@/db/schema";
import { isScopedToBoard, getScopedBoardIds } from "@/lib/character-jobs";

const INSTRUCTOR_JOBS = ["instructor", "assistant_instructor"] as const;

/**
 * A character can post lessons to a class board if they're assigned to it —
 * either the classic explicit grant (for quiet helpers with no public job),
 * or a scoped Instructor/Assistant Instructor job for this specific board.
 * Admins bypass this entirely (checked separately, at the account level).
 */
export async function isAssignedToClass(
  characterId: number,
  boardId: number
): Promise<boolean> {
  const [row] = await db
    .select({ id: classAssignments.id })
    .from(classAssignments)
    .where(
      and(
        eq(classAssignments.characterId, characterId),
        eq(classAssignments.boardId, boardId)
      )
    );
  if (row) return true;

  return isScopedToBoard(characterId, [...INSTRUCTOR_JOBS], boardId);
}

/** All class boards a character is assigned to teach, either way. */
export async function getAssignedClassBoardIds(characterId: number): Promise<number[]> {
  const rows = await db
    .select({ boardId: classAssignments.boardId })
    .from(classAssignments)
    .where(eq(classAssignments.characterId, characterId));
  const scoped = await getScopedBoardIds(characterId, [...INSTRUCTOR_JOBS]);
  return [...new Set([...rows.map((r) => r.boardId), ...scoped])];
}
