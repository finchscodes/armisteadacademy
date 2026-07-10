import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { classEnrollments } from "@/db/schema";

export async function isEnrolledInClass(characterId: number, boardId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: classEnrollments.id })
    .from(classEnrollments)
    .where(and(eq(classEnrollments.characterId, characterId), eq(classEnrollments.boardId, boardId)));
  return Boolean(row);
}

/** Every class board id a character is enrolled in. */
export async function getEnrolledClassBoardIds(characterId: number): Promise<number[]> {
  const rows = await db
    .select({ boardId: classEnrollments.boardId })
    .from(classEnrollments)
    .where(eq(classEnrollments.characterId, characterId));
  return rows.map((r) => r.boardId);
}
