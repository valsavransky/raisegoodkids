// Translates a gig's effort tier into progress toward the active goal.
//
// ASSUMPTION FLAGGED FOR CONFIRMATION: docs/vision-doc-kids-goals-app.md says
// the parent picks an effort tier (not a dollar amount), and the app "backs
// into" a dollar value behind the scenes — but no concrete dollar-per-tier
// defaults are specified anywhere in the docs. The values below are a
// placeholder guess so the progress bar/percentage math has something to
// run on; they should be reviewed (and probably made parent-configurable)
// before this is treated as real product behavior.
import { Goal, GigEffortTier } from '../types/models';

export const EFFORT_TIER_DOLLAR_VALUES: Record<GigEffortTier, number> = {
  quick: 3,
  medium: 7,
  big_job: 15,
};

/**
 * Percentage of the goal's cost a completed gig at this effort tier is
 * worth, after the Future Fund skim is taken off the top.
 */
export function computeGigPercentage(
  effortTier: GigEffortTier,
  goal: Goal,
  futureFundPercentage: number
): number {
  if (goal.realWorldCost <= 0) return 0;
  const grossValue = EFFORT_TIER_DOLLAR_VALUES[effortTier];
  const netValue = grossValue * (1 - futureFundPercentage / 100);
  return Math.round((netValue / goal.realWorldCost) * 100);
}

export function estimateGigsToGo(remainingPercentage: number, activeGigPercentages: number[]): number {
  if (remainingPercentage <= 0) return 0;
  if (activeGigPercentages.length === 0) return 0;
  const average = activeGigPercentages.reduce((sum, p) => sum + p, 0) / activeGigPercentages.length;
  if (average <= 0) return 0;
  return Math.max(1, Math.ceil(remainingPercentage / average));
}
