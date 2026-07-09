export type GradeTier = "perfect" | "excellent" | "good" | "needs_improvement" | "failing";

export const GRADE_TIER_VALUES: [GradeTier, ...GradeTier[]] = [
  "perfect",
  "excellent",
  "good",
  "needs_improvement",
  "failing",
];

type TierMeta = { label: string; numeric: number; color: string };

export const GRADE_TIER_META: Record<GradeTier, TierMeta> = {
  perfect: { label: "Perfect", numeric: 100, color: "#4CAF7D" },
  excellent: { label: "Excellent", numeric: 80, color: "#87ad82" },
  good: { label: "Good", numeric: 60, color: "#B9AD5A" },
  needs_improvement: { label: "Needs Improvement", numeric: 40, color: "#c68f7d" },
  failing: { label: "Failing", numeric: 20, color: "#cc6b6b" },
};

export function tierLabel(tier: GradeTier): string {
  return GRADE_TIER_META[tier].label;
}

export function tierColor(tier: GradeTier): string {
  return GRADE_TIER_META[tier].color;
}

/** Nearest tier to a given numeric value (0-100), used to bucket a consensus average. */
function nearestTier(numeric: number): GradeTier {
  let closest: GradeTier = "failing";
  let closestDistance = Infinity;
  for (const tier of GRADE_TIER_VALUES) {
    const distance = Math.abs(GRADE_TIER_META[tier].numeric - numeric);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = tier;
    }
  }
  return closest;
}

/**
 * Consensus grade from multiple graders' tiers: average their numeric values,
 * then bucket the average to the nearest tier. Returns both the final tier
 * and its numeric value (used for payout calculation).
 */
export function computeConsensus(tiers: GradeTier[]): { tier: GradeTier; numeric: number } {
  const average =
    tiers.reduce((sum, t) => sum + GRADE_TIER_META[t].numeric, 0) / tiers.length;
  const tier = nearestTier(average);
  return { tier, numeric: Math.round(average) };
}
