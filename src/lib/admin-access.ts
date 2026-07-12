import { db } from "@/db";
import { characterJobs, boards } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS, type CharacterJob } from "@/lib/roles";

/** Jobs that can reach a limited version of the admin panel, beyond true admins. */
export const ADMIN_PANEL_JOBS: CharacterJob[] = [...MANAGEMENT_JOBS, "field_agent"];

export type AdminAccessContext = {
  isFullAdmin: boolean;
  /** Can see the Users page at all (in hire-only mode, unless full admin). */
  canAccessUsers: boolean;
  /** Hall boards this character can manage the welcome message for (RA, scoped). */
  hallBoardIds: number[];
  /** Class boards this character can grade (Instructor/Assistant Instructor, scoped). */
  gradingBoardIds: number[];
};

export async function getAdminAccessContext(
  characterId: number | null,
  isSessionAdmin: boolean
): Promise<AdminAccessContext> {
  if (isSessionAdmin) {
    return { isFullAdmin: true, canAccessUsers: true, hallBoardIds: [], gradingBoardIds: [] };
  }
  if (!characterId) {
    return { isFullAdmin: false, canAccessUsers: false, hallBoardIds: [], gradingBoardIds: [] };
  }

  const canAccessUsers = await characterHasAnyJob(characterId, ADMIN_PANEL_JOBS);

  const scopedJobs = await db
    .select({ job: characterJobs.job, scopeBoardId: characterJobs.scopeBoardId })
    .from(characterJobs)
    .where(eq(characterJobs.characterId, characterId));

  const hallBoardIds = scopedJobs
    .filter((j) => j.job === "field_agent" && j.scopeBoardId !== null)
    .map((j) => j.scopeBoardId as number);
  const gradingBoardIds = scopedJobs
    .filter((j) => (j.job === "instructor" || j.job === "assistant_instructor") && j.scopeBoardId !== null)
    .map((j) => j.scopeBoardId as number);

  return { isFullAdmin: false, canAccessUsers, hallBoardIds, gradingBoardIds };
}

/** Whether this context grants access to the admin panel at all (some limited view). */
export function hasAnyAdminAccess(ctx: AdminAccessContext): boolean {
  return ctx.isFullAdmin || ctx.canAccessUsers || ctx.hallBoardIds.length > 0 || ctx.gradingBoardIds.length > 0;
}

/** Names for hallBoardIds/gradingBoardIds, for display. */
export async function getBoardNames(boardIds: number[]) {
  if (boardIds.length === 0) return [];
  return db.select({ id: boards.id, name: boards.name, slug: boards.slug }).from(boards).where(inArray(boards.id, boardIds));
}
