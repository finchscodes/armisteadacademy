/**
 * Jobs now belong to CHARACTERS, not accounts. A character's job determines
 * their name color in chat and their entry on the Job List page.
 *
 * Admin is separate — it's an account-level flag (users.is_admin), so every
 * character on an admin's account has hidden admin access regardless of job.
 *
 * One job title here is still a placeholder because the spec left it blank:
 *   - "head_staff" was listed as "Yellow: Head Staff of ___" with no department
 * Rename the `label` (and the enum value + migration, if you want the DB key
 * to match) once you've got the real name — everything else keys off this
 * one file.
 */
export type CharacterJob =
  | "none"
  | "spymaster"
  | "secretary"
  | "field_agent"
  | "head_staff"
  | "instructor"
  | "chief_editor"
  | "assistant_instructor"
  | "prefect"
  | "student_council"
  | "writer"
  | "media_team"
  | "library_handler"
  | "registrar"
  | "handler";

export const JOB_VALUES: [CharacterJob, ...CharacterJob[]] = [
  "none",
  "spymaster",
  "secretary",
  "field_agent",
  "head_staff",
  "instructor",
  "chief_editor",
  "assistant_instructor",
  "prefect",
  "student_council",
  "writer",
  "media_team",
  "library_handler",
  "registrar",
  "handler",
];

type JobMeta = {
  label: string;
  /** Hex color for chat/name display. null = no special color. */
  color: string | null;
};

export const JOB_META: Record<CharacterJob, JobMeta> = {
  none: { label: "None", color: null },
  // Job colors are deliberately deep/rich jewel tones — majors are soft
  // dusty pastels and halls are the four foundational site colors, so jobs
  // needed their own distinct register instead of colliding with either.
  // Hues below are spaced using a golden-angle distribution (~137.5° steps)
  // across the 14 active/inactive jobs, then hand-assigned so that roles
  // that might plausibly sit near each other (management jobs, or ones
  // with similar-sounding names like Prefect/Student Council) land in
  // different hue families rather than near-neighbors on the wheel.
  spymaster: { label: "Spymaster", color: "#2C397D" }, // Deep indigo — isolated from every other job's hue family
  secretary: { label: "Secretary", color: "#2C7D79" }, // Teal-cyan
  field_agent: { label: "Resident Advisor", color: "#7D2C3D" }, // Wine-red — one RA per hall, see lib/halls.ts
  head_staff: { label: "Head Staff", color: "#7D622C" }, // Amber-gold — placeholder, department TBD
  instructor: { label: "Instructor", color: "#2C7D33" }, // Green
  chief_editor: { label: "Chief Editor", color: "#2C7D5E" }, // Teal-green
  assistant_instructor: { label: "Assistant Instructor", color: "#517D2C" }, // Olive-green
  prefect: { label: "Prefect", color: "#4A2C7D" }, // Purple — was "Student Council" (originally Enforcer)
  student_council: { label: "Student Council", color: "#7D2C68" }, // Magenta-pink — was "School Board Member"
  writer: { label: "Writer", color: "#7D472C" }, // Burnt orange-brown
  media_team: { label: "Media Team", color: "#2C547D" }, // Deep blue
  library_handler: { label: "Library Handler", color: "#6C7D2C" }, // Olive-yellow
  registrar: { label: "Registrar", color: "#762C7D" }, // Magenta-purple
  handler: { label: "Handler", color: "#7D362C" }, // Rust-red
};

export function jobLabel(job: CharacterJob): string {
  return JOB_META[job]?.label ?? job;
}

/** Hex color for a job, or null for no job (no special styling). */
export function jobColor(job: CharacterJob): string | null {
  return JOB_META[job]?.color ?? null;
}

/**
 * Retired jobs — not offered in any "assign a job" dropdown anymore, but
 * kept in CharacterJob/JOB_META (not deleted) so any character who already
 * holds one still displays correctly, and so they're easy to bring back
 * later if needed.
 */
export const INACTIVE_JOBS: CharacterJob[] = ["media_team", "library_handler"];

/** JOB_VALUES minus retired jobs — use this for any new-assignment dropdown. */
export const ACTIVE_JOB_VALUES: CharacterJob[] = JOB_VALUES.filter((j) => !INACTIVE_JOBS.includes(j));

/** Jobs worth showing on the public Job List page (everything except "none"). */
export function isListedJob(job: CharacterJob): boolean {
  return job !== "none";
}

/**
 * "Head Staff and upwards" — these jobs can post to article boards (Notice
 * Board, Community Board) and can edit anyone's topic posts, without needing
 * an explicit admin grant. Everyone else needs one (article boards) or is
 * limited to their own posts (topic edit).
 */
export const MANAGEMENT_JOBS: CharacterJob[] = ["spymaster", "secretary", "head_staff"];

/** Who can timeout/delete in chat — management, plus Assistant Instructors and Prefects specifically. */
export const CHAT_MODERATOR_JOBS: CharacterJob[] = [...MANAGEMENT_JOBS, "assistant_instructor", "prefect"];

/** Who can lock/unlock a topic, or delete it outright — management, plus Prefects. */
export const TOPIC_MODERATOR_JOBS: CharacterJob[] = [...MANAGEMENT_JOBS, "prefect"];

export function isManagementJob(job: CharacterJob): boolean {
  return MANAGEMENT_JOBS.includes(job);
}
