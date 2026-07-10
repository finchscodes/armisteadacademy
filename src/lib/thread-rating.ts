export const RATING_META: Record<number, { label: string; description: string; color: string }> = {
  1: {
    label: "1 — Everyday",
    description: "Everyday interactions, safe to proceed.",
    color: "#6b9e6b",
  },
  2: {
    label: "2 — Tension",
    description: "Tension and angst, brief mentions that might require trigger warnings.",
    color: "#a8a05a",
  },
  3: {
    label: "3 — Sensitive",
    description: "Fights or other sensitive topics — trigger warnings are often used.",
    color: "#c98a4b",
  },
  4: {
    label: "4 — Dark",
    description: "Dark themes — a trigger warning is mentioned once at the start to cover everything.",
    color: "#c25b5b",
  },
  5: {
    label: "5 — Anarchistic",
    description: "Completely anarchistic — proceed with caution.",
    color: "#8b3a3a",
  },
};

export const RATING_VALUES = [1, 2, 3, 4, 5];

export function ratingLabel(rating: number | null): string {
  if (!rating) return "";
  return RATING_META[rating]?.label ?? `Rating ${rating}`;
}

export function ratingColor(rating: number | null): string | null {
  if (!rating) return null;
  return RATING_META[rating]?.color ?? null;
}
