export type Major = {
  value: string;
  label: string;
  description: string;
  /** Hex color used for the character's name wherever it's displayed. */
  color: string;
  /**
   * Whether a character can pick this at creation / while still Undecided.
   */
  selectable: boolean;
};

/**
 * These values are the literal enum labels stored in the database
 * (see `characterMajorEnum` in src/db/schema.ts) — keep them in sync.
 */
export const MAJORS: Major[] = [
  {
    value: "Threat Elimination",
    label: "Threat Elimination",
    description:
      "Hand-to-hand combat and melee weapons training — deadly up close, typically needing nothing but bare hands. Often work as assassins for hire.",
    color: "#c68f7d",
    selectable: true,
  },
  {
    value: "Precision Shooting",
    label: "Precision Shooting",
    description:
      "\"One shot, one kill.\" Snipers to pistols, nothing wasted, always calculated. Often work as assassins for hire.",
    color: "#8bacc1",
    selectable: true,
  },
  {
    value: "Covert Operations",
    label: "Covert Operations",
    description:
      "In and out without a trace. Thrive in stealth missions and infiltrations where silence is survival, working as undercover teams.",
    color: "#cc8696",
    selectable: true,
  },
  {
    value: "Linguistics, Culture, & Assimilation",
    label: "Linguistics, Culture, & Assimilation",
    description:
      "Blend seamlessly into any situation worldwide, as if they've lived there all their lives — perfect replicants of personas. Work across various fields.",
    color: "#a093ba",
    selectable: true,
  },
  {
    value: "Advanced Encryption",
    label: "Advanced Encryption",
    description:
      "Hacking, counterintelligence, cybersecurity. No technology is safe if unattended. The first and last line of defense; also operate as mission support.",
    color: "#87ad82",
    selectable: true,
  },
  {
    value: "Survival, Communications, & Navigation",
    label: "Survival, Communications, & Navigation",
    description:
      "The most slippery major — high-speed driving, wilderness survival, escaping fortresses. The reason anyone gets home when plans fall apart. Also operate as mission support.",
    color: "#B9AD5A",
    selectable: true,
  },
  {
    value: "Research & Development",
    label: "Research & Development",
    description:
      "Developing gadgets and improving gear. Expert engineers with groundbreaking (if questionable) research. Also operate as mission support.",
    color: "#6eaa9d",
    selectable: true,
  },
  {
    value: "Medicine, Chemistry, & Criminology",
    label: "Medicine, Chemistry, & Criminology",
    description:
      "Could plot the perfect crime with no evidence, and get away with it. Field medics to forensic analysts — a broad path with several directions. Also operate as mission support.",
    color: "#8F727B",
    selectable: true,
  },
  {
    value: "Seduction, Interrogation, & Influence Tactics",
    label: "Seduction, Interrogation, & Influence Tactics",
    description:
      "Psychological manipulation, molded to get whatever they want. Reads people like a book — and uses them without them even knowing it.",
    color: "#CEA7CD",
    selectable: true,
  },
  {
    value: "Protection & Enforcement",
    label: "Protection & Enforcement",
    description:
      "Defensive and protective — escort extractions, risk analysis, defense strategy. Often personal bodyguards or law enforcement.",
    color: "#958D72",
    selectable: true,
  },
  {
    value: "Undecided",
    label: "Undecided",
    description: "Hasn't chosen yet — students are free to experiment until the end of their first year.",
    color: "#727594",
    selectable: true,
  },
];

export const MAJOR_VALUES = MAJORS.map((m) => m.value) as [string, ...string[]];

/** What a character can pick at creation, or while still Undecided. */
export const SELECTABLE_MAJORS = MAJORS.filter((m) => m.selectable);

export const UNDECIDED_MAJOR = "Undecided";

export function getMajorDescription(value: string | null | undefined): string | null {
  return MAJORS.find((m) => m.value === value)?.description ?? null;
}

export function getMajorColor(value: string | null | undefined): string | null {
  return MAJORS.find((m) => m.value === value)?.color ?? null;
}
