// Fixed badge-shelf catalog (screen 11). Modest and specific rather than
// exhaustive — same philosophy as the content library: better to start
// small and revise with real usage than over-author guesses up front.
//
// ASSUMPTION FLAGGED FOR CONFIRMATION: streak/milestone thresholds below
// (1/3/7/14/30 day streaks, 1/5/20 gigs, $50/$100/$250 Future Fund) aren't
// specified anywhere in the docs — picked as reasonable defaults. Review
// before treating as final.
//
// Character/grit badges (docs/screens-and-flows.md, screen 10) are
// deliberately excluded from this catalog: that badge is earned by
// resubmitting a declined gig, and the decline/retry flow doesn't exist in
// this build (gigs are approved instantly — see the Approval model
// revision). Add it back if/when that flow is built.
import React from 'react';
import { BadgeType } from '../types/models';
import { colors } from '../theme/colors';
import { HeartHandshakeIcon } from '../components/icons/HeartHandshakeIcon';

// Almost every badge icon is a plain emoji string, matching the rest of
// the app's icon language. The streak-3 entry is the one exception — see
// HeartHandshakeIcon for why an emoji can't stand in for it.
export type BadgeIcon = string | React.ComponentType<{ size?: number; color?: string }>;

export interface BadgeCatalogEntry {
  catalogId: string;
  type: BadgeType;
  title: string;
  subtitle: string;
  /** Kid-facing "how to earn it" line, shown on the badge shelf's detail sheet. */
  requirement: string;
  icon: BadgeIcon;
  color: string;
}

// Icons escalate in "prestige" within each family (streak: spark → heart →
// star → gem → crown) rather than reusing one icon at every tier, so a glance at
// the shelf tells you which badges are the bigger deal.
export const BADGE_CATALOG: BadgeCatalogEntry[] = [
  { catalogId: 'streak_1', requirement: 'Finish all your Expected activities in one day.', type: 'streak', title: '1-Day Streak', subtitle: 'Expected badge earned', icon: '✨', color: colors.expected },
  { catalogId: 'streak_3', requirement: 'Finish all your Expected activities 3 days in a row.', type: 'streak', title: '3-Day Streak', subtitle: 'Expected badge earned', icon: HeartHandshakeIcon, color: colors.expected },
  { catalogId: 'streak_7', requirement: 'Finish all your Expected activities 7 days in a row.', type: 'streak', title: '7-Day Streak', subtitle: 'Expected badge earned', icon: '🌟', color: colors.expected },
  { catalogId: 'streak_14', requirement: 'Finish all your Expected activities 14 days in a row.', type: 'streak', title: '14-Day Streak', subtitle: 'Expected badge earned', icon: '💎', color: colors.expected },
  { catalogId: 'streak_30', requirement: 'Finish all your Expected activities 30 days in a row.', type: 'streak', title: '30-Day Streak', subtitle: 'Expected badge earned', icon: '👑', color: colors.expected },
  { catalogId: 'weekly_expected_done', requirement: 'Finish every weekly activity in one week.', type: 'weekly_complete', title: 'Weekly All-Star', subtitle: 'Expected badge earned', icon: '🗓️', color: colors.expected },
  { catalogId: 'gig_milestone_1', requirement: 'Finish your first gig.', type: 'gig_milestone', title: 'First Gig', subtitle: 'Gig badge earned', icon: '🪙', color: colors.gigs },
  { catalogId: 'gig_milestone_5', requirement: 'Finish 5 gigs.', type: 'gig_milestone', title: '5 Gigs Done', subtitle: 'Gig badge earned', icon: '💰', color: colors.gigs },
  { catalogId: 'gig_milestone_20', requirement: 'Finish 20 gigs.', type: 'gig_milestone', title: '20 Gigs Done', subtitle: 'Gig badge earned', icon: '🎖️', color: colors.gigs },
  { catalogId: 'big_job_done', requirement: 'Finish a big job gig.', type: 'big_job_done', title: 'Big Job Done', subtitle: 'Gig badge earned', icon: '🦸', color: colors.gigs },
  { catalogId: 'goal_achieved', requirement: 'Get a goal to 100%.', type: 'goal_achieved', title: 'Goal Achieved', subtitle: 'You reached a goal', icon: '🏆', color: colors.gigs },
  { catalogId: 'future_fund_50', requirement: 'Save $50 in your Future Fund.', type: 'future_fund_milestone', title: '$50 Saved', subtitle: 'Future Fund badge earned', icon: '🌱', color: colors.futureFund },
  { catalogId: 'future_fund_100', requirement: 'Save $100 in your Future Fund.', type: 'future_fund_milestone', title: '$100 Saved', subtitle: 'Future Fund badge earned', icon: '🪴', color: colors.futureFund },
  { catalogId: 'future_fund_250', requirement: 'Save $250 in your Future Fund.', type: 'future_fund_milestone', title: '$250 Saved', subtitle: 'Future Fund badge earned', icon: '🌳', color: colors.futureFund },
];

export function getBadgeCatalogEntry(catalogId: string): BadgeCatalogEntry | undefined {
  return BADGE_CATALOG.find((b) => b.catalogId === catalogId);
}

export const STREAK_THRESHOLDS: { days: number; catalogId: string }[] = [
  { days: 1, catalogId: 'streak_1' },
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
