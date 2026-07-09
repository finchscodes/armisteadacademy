import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { classAssignments } from "@/db/schema";

/**
 * A character can post lessons to a class board if they're assigned to it.
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
  return Boolean(row);
}

/** All class boards a character is assigned to teach. */
export async function getAssignedClassBoardIds(characterId: number): Promise<number[]> {
  const rows = await db
    .select({ boardId: classAssignments.boardId })
    .from(classAssignments)
    .where(eq(classAssignments.characterId, characterId));
  return rows.map((r) => r.boardId);
}
