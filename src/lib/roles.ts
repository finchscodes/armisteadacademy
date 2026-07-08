/**
 * Two job titles here are placeholders because the spec left them blank:
 *   - "field_agent" was listed as "Red:" with no title given
 *   - "head_staff" was listed as "Yellow: Head Staff of ___" with no department
 * Rename the `label` (and the enum value + migration, if you want the DB key
 * to match) once you've got the real names — everything else keys off this
 * one file.
 */
export type UserRole =
  | "member"
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

export const ROLE_VALUES: [UserRole, ...UserRole[]] = [
  "member",
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

type RoleMeta = {
  label: string;
  /** Hex color for chat/name display. null = no special color (regular member). */
  color: string | null;
  /** Shown on the job list page under each job title. */
  description?: string;
};

export const ROLE_META: Record<UserRole, RoleMeta> = {
  member: { label: "Member", color: null },
  spymaster: {
    label: "Spymaster",
    color: "#4CAF7D", // Green
    description: "Runs the whole operation. Full site administration.",
  },
  secretary: { label: "Secretary", color: "#3D6FB0" }, // Blue
  field_agent: {
    label: "Field Agent",
    color: "#D9534F", // Red — placeholder title, real name TBD
  },
  head_staff: {
    label: "Head Staff",
    color: "#E0C341", // Yellow — placeholder, "Head Staff of ___" department TBD
  },
  instructor: {
    label: "Instructor",
    color: "#A8D948", // Lime
    description: "Can post lessons.",
  },
  chief_editor: {
    label: "Chief Editor",
    color: "#5AA9A3", // Teal
    description: 'About Actual School Life (Inside Ploy); maintaining "this is a normal school" paper (Armistead Weekly).',
  },
  assistant_instructor: {
    label: "Assistant Instructor",
    color: "#E8E8E8", // White
    description: "Can post lessons.",
  },
  enforcer: { label: "Enforcer", color: "#9B6FD1" }, // Purple
  school_board_member: {
    label: "School Board Member",
    color: "#C6A8E8", // Lilac
    description: "Plans the school dances.",
  },
  writer: { label: "Writer", color: "#E0435A" }, // Scarlett
  media_team: { label: "Media Team", color: "#C13E7A" }, // Boysenberry
  library_handler: { label: "Library Handler", color: "#E08A3C" }, // Orange
  gatekeeper: {
    label: "Gatekeeper",
    color: "#29ABE2", // Smurf
    description: "Handles who comes in and out.",
  },
  operator: {
    label: "Operator",
    color: "#A15C56", // Muted Red
    description: "Quests.",
  },
};

export function roleLabel(role: UserRole): string {
  return ROLE_META[role]?.label ?? role;
}

/** Hex color for a role, or null for regular members (no special styling). */
export function roleColor(role: UserRole): string | null {
  return ROLE_META[role]?.color ?? null;
}

export function canPostLessons(role: UserRole): boolean {
  return role === "instructor" || role === "assistant_instructor" || role === "spymaster";
}

/** Only Spymaster gets the admin dashboard — deliberately a single-person role. */
export function isAdmin(role: UserRole): boolean {
  return role === "spymaster";
}

/** Roles worth showing on the public job list page (everything except plain members). */
export function isListedJob(role: UserRole): boolean {
  return role !== "member";
}
