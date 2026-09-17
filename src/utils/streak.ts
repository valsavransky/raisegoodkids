// Streak is deliberately derived, not stored (see src/types/models.ts) — this
// walks backward from today counting consecutive fully-completed days.
import { ExpectedItem, ExpectedCompletion } from '../types/models';
import { addDays } from './date';
import { isExpectedItemSatisfied } from './expectedItemStatus';

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

export function computeExpectedStreak(
  activeItems: ExpectedItem[],
  completions: ExpectedCompletion[],
  todayStr: string
): number {
  if (activeItems.length === 0) return 0;
  let streak = 0;
  let cursor = todayStr;
  while (isDayFullyCompleted(cursor, activeItems, completions)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
