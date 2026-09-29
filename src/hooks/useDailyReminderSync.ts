// Keeps the daily reminder's scheduled notifications in step with the app:
// re-syncs when something gets checked off, when the child profile changes,
// and whenever the app returns to the foreground (which also rolls the
// schedule forward a day). See src/services/dailyReminder.ts.
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { syncDailyReminder } from '../services/dailyReminder';
import { todayString, localDateOf } from '../utils/date';

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

export function useDailyReminderSync() {
  const { childProfile, expectedCompletions, gigCompletions } = useAppData();
  const latest = useRef({ childName: childProfile?.name, expectedCompletions, gigCompletions, hasProfile: !!childProfile });
  latest.current = { childName: childProfile?.name, expectedCompletions, gigCompletions, hasProfile: !!childProfile };

  const run = () => {
    const { childName, expectedCompletions: exp, gigCompletions: gigs, hasProfile } = latest.current;
    if (!hasProfile) return;
    const doneToday = isSomethingDoneToday(exp, gigs);
    syncDailyReminder({ childName, doneToday });
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childProfile?.id, childProfile?.name, expectedCompletions.length, gigCompletions.length]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
