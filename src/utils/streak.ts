// Streak is deliberately derived, not stored (see src/types/models.ts) — this
// walks backward from today counting consecutive fully-completed days.
import { ExpectedItem, ExpectedCompletion } from '../types/models';
import { addDays } from './date';
import { isExpectedItemSatisfied } from './expectedItemStatus';
import { isItemExcusable } from './excuse';

// Only daily items count toward a "fully completed" day — same reasoning as
// the Gigs gate (AppDataContext.allExpectedDoneToday): a weekly item has the
// rest of the week to get done, so an outstanding one shouldn't hold up
// today's streak any more than it should hold up today's Gigs.
export function isDayFullyCompleted(
  dateStr: string,
  activeItems: ExpectedItem[],
  completions: ExpectedCompletion[]
): boolean {
  const dailyItems = activeItems.filter((item) => item.frequency === 'daily');
  if (dailyItems.length === 0) return false;
  return dailyItems.every((item) =>
    isExpectedItemSatisfied(item, completions, dateStr, { excludeCorrected: true })
  );
}

export type DayStatus = 'complete' | 'paused' | 'broken';

/** 'complete' when every daily activity was done; 'paused' on an excused day
 * where only excusable ones are missing (the streak neither grows nor
 * breaks); otherwise 'broken'. */
export function dayStatus(
  dateStr: string,
  activeItems: ExpectedItem[],
  completions: ExpectedCompletion[],
  isExcused?: (dateStr: string) => boolean
): DayStatus {
  if (isDayFullyCompleted(dateStr, activeItems, completions)) return 'complete';
  if (isExcused?.(dateStr)) {
    const required = activeItems.filter((item) => item.frequency === 'daily' && !isItemExcusable(item));
    if (required.every((item) => isExpectedItemSatisfied(item, completions, dateStr, { excludeCorrected: true }))) {
      return 'paused';
    }
  }
  return 'broken';
}

const MAX_DAYS_BACK = 400;

export function computeExpectedStreak(
  activeItems: ExpectedItem[],
  completions: ExpectedCompletion[],
  todayStr: string,
  isExcused?: (dateStr: string) => boolean
): number {
  if (activeItems.length === 0) return 0;
  let streak = 0;
  let cursor = todayStr;
  for (let i = 0; i < MAX_DAYS_BACK; i += 1) {
    const status = dayStatus(cursor, activeItems, completions, isExcused);
    if (status === 'broken') break;
    if (status === 'complete') streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
