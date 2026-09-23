// "What's on today" derivation for Today's Trail — matches recurring events
// by weekday and one-off events by date, same matching precedent already
// used by ScheduleScreen's (Settings) day-grouped list (no cadence-aware recurrence
// math for biweekly/monthly; cadence is label-only there too, so this stays
// consistent rather than adding a level of precision nothing else in the
// app actually has).
import { ScheduleEvent } from '../types/models';
import { todayString } from '../utils/date';

export type TodayEventStatus = 'next' | 'upcoming' | 'past' | 'anytime';

export interface TodayScheduleEvent extends ScheduleEvent {
  status: TodayEventStatus;
}

function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function formatClock(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h24 = parseInt(hStr, 10);
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 || 12;
  return `${h}:${mStr} ${period}`;
}

export function formatEventTimeRange(event: ScheduleEvent): string | null {
  if (!event.startTime) return null;
  const start = formatClock(event.startTime);
  return event.endTime ? `${start}–${formatClock(event.endTime)}` : start;
}

/** Today's schedule events, sorted chronologically (untimed events last),
 * with the earliest one that hasn't ended yet marked "next" — recomputed
 * fresh on each call rather than kept live, since callers re-run this on
 * screen focus instead of ticking a clock. */
export function scheduleEventsForToday(events: ScheduleEvent[]): TodayScheduleEvent[] {
  const todayWeekday = new Date().getDay();
  const today = todayString();
  const matches = events.filter((e) => (e.recurring ? (e.daysOfWeek ?? []).includes(todayWeekday) : e.date === today));

  const sorted = [...matches].sort((a, b) => {
    const am = toMinutes(a.startTime);
    const bm = toMinutes(b.startTime);
    if (am === null && bm === null) return 0;
    if (am === null) return 1;
    if (bm === null) return -1;
    return am - bm;
  });

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let nextMarked = false;

  return sorted.map((event) => {
    const start = toMinutes(event.startTime);
    if (start === null) return { ...event, status: 'anytime' as const };

    const end = toMinutes(event.endTime) ?? start;
    if (nowMinutes > end) return { ...event, status: 'past' as const };

    if (!nextMarked) {
      nextMarked = true;
      return { ...event, status: 'next' as const };
    }
    return { ...event, status: 'upcoming' as const };
  });
}
