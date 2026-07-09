import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { characterJobs, characters } from "@/db/schema";
import { JOB_VALUES, type CharacterJob } from "@/lib/roles";

/** Priority order for picking one "primary" job when coloring a name in chat/posts/feed. */
const PRIORITY_ORDER = JOB_VALUES.filter((j) => j !== "none");

function pickPrimary(jobs: CharacterJob[]): CharacterJob {
  return PRIORITY_ORDER.find((p) => jobs.includes(p)) ?? "none";
}

/**
 * For name-coloring purposes, a character with multiple jobs shows one color
 * — their highest-priority job (see JOB_VALUES order in lib/roles.ts). The
 * Job List page itself shows every job they hold, not just this one.
 */
export async function getPrimaryJobsForCharacters(
  characterIds: number[]
): Promise<Map<number, CharacterJob>> {
  if (characterIds.length === 0) return new Map();

  const rows = await db
    .select({ characterId: characterJobs.characterId, job: characterJobs.job })
    .from(characterJobs)
    .where(inArray(characterJobs.characterId, characterIds));

  const byCharacter = new Map<number, CharacterJob[]>();
  for (const row of rows) {
    if (!byCharacter.has(row.characterId)) byCharacter.set(row.characterId, []);
    byCharacter.get(row.characterId)!.push(row.job);
  }

  const result = new Map<number, CharacterJob>();
  for (const id of characterIds) {
    result.set(id, pickPrimary(byCharacter.get(id) ?? []));
  }
  return result;
}

export async function getPrimaryJob(characterId: number): Promise<CharacterJob> {
  const map = await getPrimaryJobsForCharacters([characterId]);
  return map.get(characterId) ?? "none";
}

/** Every job a character holds, with any custom title. */
export async function getJobsForCharacter(characterId: number) {
  return db.select().from(characterJobs).where(eq(characterJobs.characterId, characterId));
}

/**
 * Every job in the system, each with every character who currently holds it
 * (including jobs nobody holds — the Job List shows all of them).
 */
export async function getJobBoardData() {
  const rows = await db
    .select({
      job: characterJobs.job,
      jobTitle: characterJobs.jobTitle,
      characterId: characters.id,
      characterSlug: characters.slug,
      characterFirstName: characters.firstName,
      characterLastName: characters.lastName,
      characterAvatarUrl: characters.avatarUrl,
    })
    .from(characterJobs)
    .innerJoin(characters, eq(characterJobs.characterId, characters.id));

  const byJob = new Map<CharacterJob, typeof rows>();
  for (const job of PRIORITY_ORDER) byJob.set(job, []);
  for (const row of rows) {
    byJob.get(row.job)!.push(row);
  }
  return byJob;
}
