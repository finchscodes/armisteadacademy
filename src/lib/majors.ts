export type Major = {
  value: string;
  label: string;
  description: string;
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
  },
  {
    value: "Precision Shooting",
    label: "Precision Shooting",
    description:
      "\"One shot, one kill.\" Snipers to pistols, nothing wasted, always calculated. Often work as assassins for hire.",
  },
  {
    value: "Covert Operations",
    label: "Covert Operations",
    description:
      "In and out without a trace. Thrive in stealth missions and infiltrations where silence is survival, working as undercover teams.",
  },
  {
    value: "Linguistics, Culture, & Assimilation",
    label: "Linguistics, Culture, & Assimilation",
    description:
      "Blend seamlessly into any situation worldwide, as if they've lived there all their lives — perfect replicants of personas. Work across various fields.",
  },
  {
    value: "Advanced Encryption",
    label: "Advanced Encryption",
    description:
      "Hacking, counterintelligence, cybersecurity. No technology is safe if unattended. The first and last line of defense; also operate as mission support.",
  },
  {
    value: "Survival, Communications, & Navigation",
    label: "Survival, Communications, & Navigation",
    description:
      "The most slippery major — high-speed driving, wilderness survival, escaping fortresses. The reason anyone gets home when plans fall apart. Also operate as mission support.",
  },
  {
    value: "Research & Development",
    label: "Research & Development",
    description:
      "Developing gadgets and improving gear. Expert engineers with groundbreaking (if questionable) research. Also operate as mission support.",
  },
  {
    value: "Medicine, Chemistry, & Criminology",
    label: "Medicine, Chemistry, & Criminology",
    description:
      "Could plot the perfect crime with no evidence, and get away with it. Field medics to forensic analysts — a broad path with several directions. Also operate as mission support.",
  },
  {
    value: "Seduction, Interrogation, & Influence Tactics",
    label: "Seduction, Interrogation, & Influence Tactics",
    description:
      "Psychological manipulation, molded to get whatever they want. Reads people like a book — and uses them without them even knowing it.",
  },
  {
    value: "Protection & Enforcement",
    label: "Protection & Enforcement",
    description:
      "Defensive and protective — escort extractions, risk analysis, defense strategy. Often personal bodyguards or law enforcement.",
  },
  {
    value: "Undecided/Witness Protection",
    label: "Undecided/Witness Protection",
    description:
      "Hasn't chosen yet — students are free to experiment until the end of their first year. Also covers those under witness protection attending the curriculum.",
  },
  {
    value: "Graduate",
    label: "Graduate",
    description: "Finished the curriculum.",
  },
  {
    value: "Faculty",
    label: "Faculty",
    description: "Staff of the academy.",
  },
];

export const MAJOR_VALUES = MAJORS.map((m) => m.value) as [string, ...string[]];

export function getMajorDescription(value: string | null | undefined): string | null {
  return MAJORS.find((m) => m.value === value)?.description ?? null;
}
