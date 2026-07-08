export type UserRole = "member" | "instructor" | "staff" | "admin";

export function canPostLessons(role: UserRole): boolean {
  return role === "instructor" || role === "staff" || role === "admin";
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

/** Tailwind text color classes for a role, used to color names in chat and elsewhere. Empty string = no override, use default styling. */
export function roleColorClass(role: UserRole): string {
  switch (role) {
    case "admin":
      return "text-claret-500";
    case "staff":
      return "text-steel-400";
    case "instructor":
      return "text-teal-400";
    default:
      return "";
  }
}

export const ROLE_LABELS: Record<UserRole, string> = {
  member: "Member",
  instructor: "Instructor",
  staff: "Staff",
  admin: "Admin",
};
