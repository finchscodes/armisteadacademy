export type Hall = "undercroft" | "veil" | "rampart" | "eaves";

export const HALL_VALUES: Hall[] = ["undercroft", "veil", "rampart", "eaves"];

export const HALL_META: Record<Hall, { label: string; color: string; bgColor: string; description: string }> = {
  undercroft: {
    label: "Undercroft",
    color: "#496172",
    bgColor: "#2D2928",
    description: "Grounded, steady, and quietly relentless.",
  },
  veil: {
    label: "Veil",
    color: "#EEEEEE",
    bgColor: "#ACACAC",
    description: "Discreet, perceptive, and hard to pin down.",
  },
  rampart: {
    label: "Rampart",
    color: "#C43030",
    bgColor: "#1E1A19",
    description: "Disciplined, protective, and built to hold the line.",
  },
  eaves: {
    label: "Eaves",
    color: "#6C757C",
    bgColor: "#999999",
    description: "Warm, resourceful, and fiercely loyal to their own.",
  },
};

export function hallLabel(hall: Hall | string | null): string {
  if (!hall) return "";
  return HALL_META[hall as Hall]?.label ?? hall;
}

export function hallColor(hall: Hall | string | null): string | null {
  if (!hall) return null;
  return HALL_META[hall as Hall]?.color ?? null;
}

/** The paired secondary tone — useful for backgrounds/accents alongside the primary color. */
export function hallBgColor(hall: Hall | string | null): string | null {
  if (!hall) return null;
  return HALL_META[hall as Hall]?.bgColor ?? null;
}
