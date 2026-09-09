// Fixed badge-shelf catalog (screen 11). Modest and specific rather than
// exhaustive — same philosophy as the content library: better to start
// small and revise with real usage than over-author guesses up front.
//
// ASSUMPTION FLAGGED FOR CONFIRMATION: streak/milestone thresholds below
// (3/7/14/30 day streaks, 1/5/20 gigs, $50/$100/$250 Future Fund) aren't
// specified anywhere in the docs — picked as reasonable defaults. Review
// before treating as final.
//
// Character/grit badges (docs/screens-and-flows.md, screen 10) are
// deliberately excluded from this catalog: that badge is earned by
// resubmitting a declined gig, and the decline/retry flow doesn't exist in
// this build (gigs are approved instantly — see the Approval model
// revision). Add it back if/when that flow is built.
import { BadgeType } from '../types/models';
import { colors } from '../theme/colors';

export interface BadgeCatalogEntry {
  catalogId: string;
  type: BadgeType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

// Icons escalate in "prestige" within each family (streak: spark → star →
// gem → crown) rather than reusing one icon at every tier, so a glance at
// the shelf tells you which badges are the bigger deal.
export const BADGE_CATALOG: BadgeCatalogEntry[] = [
  { catalogId: 'streak_3', type: 'streak', title: '3-Day Streak', subtitle: 'Expected badge earned', icon: '🔥', color: colors.expected },
  { catalogId: 'streak_7', type: 'streak', title: '7-Day Streak', subtitle: 'Expected badge earned', icon: '🌟', color: colors.expected },
  { catalogId: 'streak_14', type: 'streak', title: '14-Day Streak', subtitle: 'Expected badge earned', icon: '💎', color: colors.expected },
  { catalogId: 'streak_30', type: 'streak', title: '30-Day Streak', subtitle: 'Expected badge earned', icon: '👑', color: colors.expected },
  { catalogId: 'gig_milestone_1', type: 'gig_milestone', title: 'First Gig', subtitle: 'Gig badge earned', icon: '🪙', color: colors.gigs },
  { catalogId: 'gig_milestone_5', type: 'gig_milestone', title: '5 Gigs Done', subtitle: 'Gig badge earned', icon: '💰', color: colors.gigs },
  { catalogId: 'gig_milestone_20', type: 'gig_milestone', title: '20 Gigs Done', subtitle: 'Gig badge earned', icon: '🎖️', color: colors.gigs },
  { catalogId: 'big_job_done', type: 'big_job_done', title: 'Big Job Done', subtitle: 'Gig badge earned', icon: '🦸', color: colors.gigs },
  { catalogId: 'goal_achieved', type: 'goal_achieved', title: 'Goal Achieved', subtitle: 'You reached a goal', icon: '🏆', color: colors.gigs },
  { catalogId: 'future_fund_50', type: 'future_fund_milestone', title: '$50 Saved', subtitle: 'Future Fund badge earned', icon: '🌱', color: colors.futureFund },
  { catalogId: 'future_fund_100', type: 'future_fund_milestone', title: '$100 Saved', subtitle: 'Future Fund badge earned', icon: '🪴', color: colors.futureFund },
  { catalogId: 'future_fund_250', type: 'future_fund_milestone', title: '$250 Saved', subtitle: 'Future Fund badge earned', icon: '🌳', color: colors.futureFund },
];

export function getBadgeCatalogEntry(catalogId: string): BadgeCatalogEntry | undefined {
  return BADGE_CATALOG.find((b) => b.catalogId === catalogId);
}

export const STREAK_THRESHOLDS: { days: number; catalogId: string }[] = [
  { days: 3, catalogId: 'streak_3' },
  { days: 7, catalogId: 'streak_7' },
  { days: 14, catalogId: 'streak_14' },
  { days: 30, catalogId: 'streak_30' },
];

export const GIG_MILESTONE_THRESHOLDS: { count: number; catalogId: string }[] = [
  { count: 1, catalogId: 'gig_milestone_1' },
  { count: 5, catalogId: 'gig_milestone_5' },
  { count: 20, catalogId: 'gig_milestone_20' },
];

// Growth-themed escalation (sprout → potted plant → tree) matching the
// Future Fund's "watch it grow" framing. $50 matches the current milestone
// threshold; $100/$250 give something bigger to keep working toward.
export const FUTURE_FUND_THRESHOLDS: { amount: number; catalogId: string }[] = [
  { amount: 50, catalogId: 'future_fund_50' },
  { amount: 100, catalogId: 'future_fund_100' },
  { amount: 250, catalogId: 'future_fund_250' },
];
