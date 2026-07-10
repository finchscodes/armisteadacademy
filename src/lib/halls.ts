export type Hall = "undercroft" | "veil" | "rampart" | "eaves";

export const HALL_VALUES: Hall[] = ["undercroft", "veil", "rampart", "eaves"];

export const HALL_META: Record<Hall, { label: string; color: string; description: string }> = {
  undercroft: {
    label: "Undercroft",
    color: "#8A7A5C",
    description: "Grounded, steady, and quietly relentless.",
  },
  veil: {
    label: "Veil",
    color: "#7A5C8A",
    description: "Discreet, perceptive, and hard to pin down.",
  },
  rampart: {
    label: "Rampart",
    color: "#5C7A8A",
    description: "Disciplined, protective, and built to hold the line.",
  },
  eaves: {
    label: "Eaves",
    color: "#8A6B4A",
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
