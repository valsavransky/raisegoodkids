// When is a child "ready for a next step"? A daily Expected activity done on at
// least 80% of its scheduled days over the last 6 weeks, with the activity at
// least 6 weeks old. Excused days and birthdays don't count against it. At most
// one idea per child at a time, and no more than one a month.
import { ChildProfile, ExpectedCompletion, ExpectedItem, NextStepIdea, NextStepState } from '../types/models';
import { nextStepFor } from '../data/nextSteps';
import { addDays } from './date';
import { isBirthdayOn, isItemExcusable } from './excuse';

export const NEXT_STEP_WINDOW_DAYS = 42;
export const NEXT_STEP_MIN_RATE = 0.8;
const MIN_SCHEDULED_DAYS = 28;
const MONTH_DAYS = 30;

export const EMPTY_NEXT_STEP_STATE: NextStepState = { dismissed: [], snoozedUntil: {}, lastAdded: {} };

export function computeNextStepIdea(args: {
  child: ChildProfile;
  items: ExpectedItem[];
  completions: ExpectedCompletion[];
  /** Days a parent excused for this child. */
  excusedDates: Set<string>;
  today: string;
  state: NextStepState;
}): NextStepIdea | null {
  const { child, items, completions, excusedDates, today, state } = args;
  const lastAdded = state.lastAdded[child.id];
  if (lastAdded && lastAdded > addDays(today, -MONTH_DAYS)) return null;

  const have = new Set(items.map((i) => i.name.trim().toLowerCase()));
  const windowStart = addDays(today, -NEXT_STEP_WINDOW_DAYS);
  let best: { idea: NextStepIdea; rate: number } | null = null;

  for (const item of items) {
    if (!item.active || item.frequency !== 'daily') continue;
    const next = nextStepFor(item.name);
    if (!next || have.has(next.name.toLowerCase())) continue;
    const key = `${child.id}|${item.name}`;
    if (state.dismissed.includes(key)) continue;
    const snoozed = state.snoozedUntil[key];
    if (snoozed && snoozed > today) continue;

    const done = new Set(completions.filter((c) => c.expectedItemId === item.id).map((c) => c.date));
    if (done.size === 0) continue;
    const first = [...done].sort()[0];
    if (first > windowStart) continue; // not 6 weeks old yet

    const excusable = isItemExcusable(item);
    let scheduled = 0;
    let doneDays = 0;
    for (let i = 1; i <= NEXT_STEP_WINDOW_DAYS; i++) {
      const day = addDays(today, -i);
      const off = excusable && (excusedDates.has(day) || isBirthdayOn(child.birthday, day));
      if (off) continue;
      scheduled += 1;
      if (done.has(day)) doneDays += 1;
    }
    if (scheduled < MIN_SCHEDULED_DAYS) continue;
    const rate = doneDays / scheduled;
    if (rate < NEXT_STEP_MIN_RATE) continue;
    if (!best || rate > best.rate) {
      best = {
        rate,
        idea: { key, childId: child.id, fromItemId: item.id, fromName: item.name, weeks: NEXT_STEP_WINDOW_DAYS / 7, next },
      };
    }
  }
  return best ? best.idea : null;
}
