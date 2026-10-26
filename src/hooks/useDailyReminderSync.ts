// Keeps the daily reminder's scheduled notifications in step with the app:
// re-syncs when something gets checked off, when the child profile changes,
// and whenever the app returns to the foreground (which also rolls the
// schedule forward a day). See src/services/dailyReminder.ts.
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { syncDailyReminder } from '../services/dailyReminder';
import { todayString, localDateOf, addDays } from '../utils/date';

/** True if anything (an Expected activity or a gig) has been checked off today. */
export function isSomethingDoneToday(
  expectedCompletions: { date: string }[],
  gigCompletions: { markedDoneAt: string }[]
): boolean {
  const today = todayString();
  return (
    expectedCompletions.some((c) => c.date === today) ||
    gigCompletions.some((c) => localDateOf(c.markedDoneAt) === today)
  );
}

/** The excused days from today through the next week (the reminder's horizon). */
export function excusedDatesAhead(isDayExcused: (date: string) => boolean, days = 8): string[] {
  const today = todayString();
  return Array.from({ length: days }, (_, i) => addDays(today, i)).filter((d) => isDayExcused(d));
}

export function useDailyReminderSync() {
  const { childProfile, expectedCompletions, gigCompletions, isDayExcused, dailyExcuses } = useAppData();
  const latest = useRef({
    childName: childProfile?.name,
    expectedCompletions,
    gigCompletions,
    hasProfile: !!childProfile,
    isDayExcused,
  });
  latest.current = {
    childName: childProfile?.name,
    expectedCompletions,
    gigCompletions,
    hasProfile: !!childProfile,
    isDayExcused,
  };

  const run = () => {
    const { childName, expectedCompletions: exp, gigCompletions: gigs, hasProfile, isDayExcused: excused } = latest.current;
    if (!hasProfile) return;
    const doneToday = isSomethingDoneToday(exp, gigs);
    syncDailyReminder({ childName, doneToday, excusedDates: excusedDatesAhead(excused) });
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childProfile?.id, childProfile?.name, childProfile?.birthday, expectedCompletions.length, gigCompletions.length, dailyExcuses.length]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
