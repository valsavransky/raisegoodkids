// Translates a gig's effort tier into progress toward the active goal.
import { Goal, GigEffortTier, GigEffortValues } from '../types/models';

/** Starting point shown in setup and used until a parent changes them in
 * Manage Expected & Gigs — see AppDataContext's gigEffortValues. */
export const DEFAULT_GIG_EFFORT_VALUES: GigEffortValues = {
  quick: 5,
  medium: 10,
  big_job: 15,
};

/**
 * Percentage of the goal's cost a completed gig at this effort tier is
 * worth, after the Future Fund skim is taken off the top.
 */
export function computeGigPercentage(
  effortTier: GigEffortTier,
  goal: Goal,
  futureFundPercentage: number,
  effortValues: GigEffortValues
): number {
  if (goal.realWorldCost <= 0) return 0;
  const grossValue = effortValues[effortTier];
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
