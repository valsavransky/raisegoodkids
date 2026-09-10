// Shared period-satisfaction check for Expected items, used by both the
// home screen's "done" state (AppDataContext) and the streak calculation
// (streak.ts) — a daily item needs a completion dated exactly the day in
// question, but a weekly item only needs one completion anywhere in that
// week (Sunday-Saturday) on or before that day, so it stays satisfied for
// the rest of the week instead of resetting the next calendar day.
import { ExpectedItem, ExpectedCompletion } from '../types/models';
import { startOfWeek } from './date';

export function isExpectedItemSatisfied(
  item: Pick<ExpectedItem, 'id' | 'frequency'>,
  completions: ExpectedCompletion[],
  dateStr: string,
  options: { excludeCorrected?: boolean } = {}
): boolean {
  const relevant = options.excludeCorrected
    ? completions.filter((c) => !c.correctedByParent)
    : completions;

  if (item.frequency === 'daily') {
    return relevant.some((c) => c.expectedItemId === item.id && c.date === dateStr);
  }

  const periodStart = startOfWeek(dateStr);
  return relevant.some(
    (c) => c.expectedItemId === item.id && c.date >= periodStart && c.date <= dateStr
  );
}
