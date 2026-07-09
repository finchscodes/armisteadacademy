/** Age is chosen once at character creation, then locked (admin can override). */
export const AGE_OPTIONS = [18, 19, 20, 21, 22, 23, 24, 25] as const;
export type CharacterAge = (typeof AGE_OPTIONS)[number];
export const DEFAULT_AGE: CharacterAge = 18;
