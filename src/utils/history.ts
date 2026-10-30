// History: everything here is worked out from data the app already stores
// (check-offs, gig completions, goals, badges), so nothing new is saved.
// Weeks run Sunday to Saturday, like the This Week view. Like the streak, a
// past day is judged against today's list of Expected activities.
import { ExpectedItem, ExpectedCompletion, Gig, GigCompletion, Goal, Badge } from '../types/models';
import { addDays, localDateOf, startOfWeek } from './date';
import { dayStatus } from './streak';
import { isExpectedItemSatisfied } from './expectedItemStatus';
import { isItemExcusable } from './excuse';
import { getBadgeCatalogEntry } from '../data/badgeCatalog';

export type HistoryDayState = 'complete' | 'partial' | 'excused' | 'none' | 'future' | 'before';

export interface HistoryDay {
  date: string;
  state: HistoryDayState;
  /** Streak length at the end of this day (excused days keep it, a miss resets it). */
  streak: number;
}

export interface HistoryWeek {
  start: string;
  end: string;
  days: HistoryDay[];
  /** Daily Expected activities done, out of those that counted (excused days don't count). */
  expectedDone: number;
  expectedTotal: number;
  gigs: number;
  /** Goal progress earned this week, in percentage points. */
  goalPercent: number;
  bestStreak: number;
  excusedDays: number;
  isCurrent: boolean;
  /** A week that has fully passed. */
  isComplete: boolean;
}

export interface HistoryInput {
  items: ExpectedItem[];
  completions: ExpectedCompletion[];
  gigCompletions: GigCompletion[];
  isExcused: (date: string) => boolean;
  today: string;
}

const MAX_WEEKS = 104;
/** Completed weeks needed before the trend chart appears. */
export const TREND_MIN_WEEKS = 4;
const TREND_MAX_WEEKS = 8;

function countedGig(c: GigCompletion): boolean {
  return c.status !== 'declined';
}

/** The first day anything was checked off, or null for a brand-new child. */
export function firstActiveDate(input: Pick<HistoryInput, 'completions' | 'gigCompletions'>): string | null {
  const dates = [
    ...input.completions.map((c) => c.date),
    ...input.gigCompletions.filter(countedGig).map((c) => localDateOf(c.markedDoneAt)),
  ];
  return dates.length === 0 ? null : dates.reduce((a, b) => (a < b ? a : b));
}

/** Every week from the first one with activity through this week, newest first. */
export function buildWeeks(input: HistoryInput): HistoryWeek[] {
  const first = firstActiveDate(input);
  if (!first) return [];
  const { items, completions, gigCompletions, isExcused, today } = input;
  const dailyItems = items.filter((i) => i.frequency === 'daily');
  const thisWeek = startOfWeek(today);
  let weekStart = startOfWeek(first);
  // Keep a long-running family fast: only the most recent weeks.
  const oldest = addDays(thisWeek, -7 * (MAX_WEEKS - 1));
  if (weekStart < oldest) weekStart = oldest;

  // The running streak needs the days before the window too, so start it from the
  // first active day and let the window cut the output.
  let streak = 0;
  const weeks: HistoryWeek[] = [];
  for (let cursor = startOfWeek(first); cursor <= thisWeek; cursor = addDays(cursor, 7)) {
    const days: HistoryDay[] = [];
    let expectedDone = 0;
    let expectedTotal = 0;
    let excusedDays = 0;
    let bestStreak = 0;
    for (let i = 0; i < 7; i += 1) {
      const date = addDays(cursor, i);
      let state: HistoryDayState;
      if (date > today) state = 'future';
      else if (date < first) state = 'before';
      else {
        const status = dayStatus(date, items, completions, isExcused);
        const done = dailyItems.filter((item) =>
          isExpectedItemSatisfied(item, completions, date, { excludeCorrected: true })
        ).length;
        if (status === 'complete') state = 'complete';
        else if (status === 'paused') state = 'excused';
        else state = done > 0 ? 'partial' : 'none';
        if (status === 'complete') streak += 1;
        else if (status !== 'paused') streak = 0;
        if (state === 'excused') excusedDays += 1;
        else {
          expectedDone += done;
          expectedTotal += dailyItems.length;
        }
      }
      if (state !== 'future' && state !== 'before') bestStreak = Math.max(bestStreak, streak);
      days.push({ date, state, streak });
    }
    const end = addDays(cursor, 6);
    const inWeek = gigCompletions.filter((c) => {
      const d = localDateOf(c.markedDoneAt);
      return countedGig(c) && d >= cursor && d <= end;
    });
    weeks.push({
      start: cursor,
      end,
      days,
      expectedDone,
      expectedTotal,
      gigs: inWeek.length,
      goalPercent: Math.round(
        inWeek.filter((c) => c.status === 'approved').reduce((sum, c) => sum + c.percentageAwarded, 0)
      ),
      bestStreak,
      excusedDays,
      isCurrent: cursor === thisWeek,
      isComplete: end < today,
    });
  }
  return weeks.filter((w) => w.start >= weekStart).reverse();
}

/** Bars for the trend chart, oldest to newest — empty until there are enough completed weeks. */
export function trendWeeks(weeks: HistoryWeek[]): { week: HistoryWeek; percent: number }[] {
  if (weeks.filter((w) => w.isComplete).length < TREND_MIN_WEEKS) return [];
  return weeks
    .filter((w) => w.expectedTotal > 0)
    .slice(0, TREND_MAX_WEEKS)
    .reverse()
    .map((week) => ({ week, percent: Math.round((week.expectedDone / week.expectedTotal) * 100) }));
}

export function weekPercent(week: HistoryWeek): number | null {
  return week.expectedTotal > 0 ? Math.round((week.expectedDone / week.expectedTotal) * 100) : null;
}

export type HistoryCell = 'done' | 'excused' | 'none' | 'future' | 'before';

export interface WeekDetail {
  expectedRows: { id: string; name: string; cells: HistoryCell[] }[];
  gigRows: { id: string; name: string; cells: boolean[] }[];
}

/** The day-by-day grid for one week: each daily activity, and each gig done that week. */
export function buildWeekDetail(
  week: HistoryWeek,
  input: HistoryInput,
  gigs: Gig[]
): WeekDetail {
  const { items, completions, gigCompletions, isExcused } = input;
  const expectedRows = items
    .filter((i) => i.frequency === 'daily')
    .map((item) => ({
      id: item.id,
      name: item.name,
      cells: week.days.map((day): HistoryCell => {
        if (day.state === 'future') return 'future';
        if (day.state === 'before') return 'before';
        if (isExpectedItemSatisfied(item, completions, day.date, { excludeCorrected: true })) return 'done';
        return isExcused(day.date) && isItemExcusable(item) ? 'excused' : 'none';
      }),
    }));
  const gigRows = gigs
    .map((gig) => ({
      id: gig.id,
      name: gig.name,
      cells: week.days.map((day) =>
        gigCompletions.some((c) => c.gigId === gig.id && countedGig(c) && localDateOf(c.markedDoneAt) === day.date)
      ),
    }))
    .filter((row) => row.cells.some(Boolean));
  return { expectedRows, gigRows };
}

export interface Milestone {
  id: string;
  /** ISO timestamp. */
  at: string;
  kind: 'goal' | 'badge';
  title: string;
  /** "Given Oct 10" for a goal that has been handed over. */
  note?: string;
}

/** Goals reached and badges earned, newest first. */
export function buildMilestones(goals: Goal[], badges: Badge[]): Milestone[] {
  const fromGoals = goals
    .filter((g) => g.achievedAt)
    .map(
      (g): Milestone => ({
        id: `goal-${g.id}`,
        at: g.achievedAt as string,
        kind: 'goal',
        title: `Goal reached: ${g.name}`,
        note: g.fulfilledAt ? `fulfilled ${localDateOf(g.fulfilledAt)}` : undefined,
      })
    );
  const fromBadges = badges.map(
    (b): Milestone => ({
      id: `badge-${b.id}`,
      at: b.earnedAt,
      kind: 'badge',
      title: getBadgeCatalogEntry(b.catalogId)?.title ?? 'Badge earned',
    })
  );
  return [...fromGoals, ...fromBadges].sort((a, b) => b.at.localeCompare(a.at));
}
