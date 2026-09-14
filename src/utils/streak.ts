// Streak is deliberately derived, not stored (see src/types/models.ts) — this
// walks backward from today counting consecutive fully-completed days.
import { ExpectedItem, ExpectedCompletion } from '../types/models';
import { addDays } from './date';
import { isExpectedItemSatisfied } from './expectedItemStatus';

export function isDayFullyCompleted(
  dateStr: string,
  activeItems: ExpectedItem[],
  completions: ExpectedCompletion[]
): boolean {
  if (activeItems.length === 0) return false;
  return activeItems.every((item) =>
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
