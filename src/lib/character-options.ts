/** Age is chosen once at character creation, then locked (admin can override). */
export const AGE_OPTIONS = [18, 19, 20, 21, 22, 23, 24, 25] as const;
export type CharacterAge = (typeof AGE_OPTIONS)[number];
export const DEFAULT_AGE: CharacterAge = 18;

/** Freely editable anytime — no locking, unlike major/age. */
export const GENDER_OPTIONS = ["Male", "Non-binary", "Female"] as const;
export type Gender = (typeof GENDER_OPTIONS)[number];

export const SOCIAL_STATUS_OPTIONS = ["Spy Born", "Family Secret", "New Blood"] as const;
export type SocialStatus = (typeof SOCIAL_STATUS_OPTIONS)[number];
