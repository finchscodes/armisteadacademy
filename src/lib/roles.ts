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
  | "enforcer"
  | "school_board_member"
  | "writer"
  | "media_team"
  | "library_handler"
  | "gatekeeper"
  | "operator";

export const JOB_VALUES: [CharacterJob, ...CharacterJob[]] = [
  "none",
  "spymaster",
  "secretary",
  "field_agent",
  "head_staff",
  "instructor",
  "chief_editor",
  "assistant_instructor",
  "enforcer",
  "school_board_member",
  "writer",
  "media_team",
  "library_handler",
  "gatekeeper",
  "operator",
];

type JobMeta = {
  label: string;
  /** Hex color for chat/name display. null = no special color. */
  color: string | null;
};

export const JOB_META: Record<CharacterJob, JobMeta> = {
  none: { label: "None", color: null },
  spymaster: { label: "Spymaster", color: "#4CAF7D" }, // Green
  secretary: { label: "Secretary", color: "#3D6FB0" }, // Blue
  field_agent: { label: "Resident Advisor", color: "#D9534F" }, // Red — one RA per hall, see lib/halls.ts
  head_staff: { label: "Head Staff", color: "#E0C341" }, // Yellow — placeholder, department TBD
  instructor: { label: "Instructor", color: "#A8D948" }, // Lime
  chief_editor: { label: "Chief Editor", color: "#5AA9A3" }, // Teal
  assistant_instructor: { label: "Assistant Instructor", color: "#E8E8E8" }, // White
  enforcer: { label: "Enforcer", color: "#9B6FD1" }, // Purple
  school_board_member: { label: "School Board Member", color: "#C6A8E8" }, // Lilac
  writer: { label: "Writer", color: "#E0435A" }, // Scarlett
  media_team: { label: "Media Team", color: "#C13E7A" }, // Boysenberry
  library_handler: { label: "Library Handler", color: "#E08A3C" }, // Orange
  gatekeeper: { label: "Gatekeeper", color: "#29ABE2" }, // Smurf
  operator: { label: "Operator", color: "#A15C56" }, // Muted Red
};

export function jobLabel(job: CharacterJob): string {
  return JOB_META[job]?.label ?? job;
}

/** Hex color for a job, or null for no job (no special styling). */
export function jobColor(job: CharacterJob): string | null {
  return JOB_META[job]?.color ?? null;
}

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

export function isManagementJob(job: CharacterJob): boolean {
  return MANAGEMENT_JOBS.includes(job);
}
