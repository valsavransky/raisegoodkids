// Keeps the daily reminder's scheduled notifications in step with the app:
// re-syncs when something gets checked off, when the child profile changes,
// and whenever the app returns to the foreground (which also rolls the
// schedule forward a day). See src/services/dailyReminder.ts.
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { syncDailyReminder } from '../services/dailyReminder';
import { todayString } from '../utils/date';

function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** True if anything (an Expected activity or a gig) has been checked off today. */
export function isSomethingDoneToday(
  expectedCompletions: { date: string }[],
  gigCompletions: { markedDoneAt: string }[]
): boolean {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  // Expected completions are dated with the app's own "today" string; gigs
  // carry a full timestamp. Check both notions of today so a reminder never
  // fires on a day the child has already done something.
  const dates = new Set([todayString(), localDateString(now)]);
  return (
    expectedCompletions.some((c) => dates.has(c.date)) ||
    gigCompletions.some((c) => new Date(c.markedDoneAt).getTime() >= startOfToday)
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
