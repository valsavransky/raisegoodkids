// All "day" logic in the app is by the device's local calendar day, never
// UTC. (These used to be derived from the UTC clock, which flips to the next
// day at UTC midnight — mid-evening in US time zones — so Today reset, and
// streaks and completions shifted a day, in the evening.)

/** YYYY-MM-DD for the given moment, in the device's local time zone. */
export function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The local calendar day an ISO timestamp (e.g. a completion's markedDoneAt)
 * falls on. */
export function localDateOf(isoTimestamp: string): string {
  return toLocalDateString(new Date(isoTimestamp));
}

export function todayString(): string {
  return toLocalDateString(new Date());
}

/** "Oct 14" (or "Oct 14, 2027" when not this year) from a YYYY-MM-DD string;
 * returns the input untouched if it isn't a valid date. */
export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toLocalDateString(d);
}

/** Sunday (0) of the week containing dateStr — the week-boundary convention
 * used for weekly Expected items, matching the 0=Sunday..6=Saturday
 * daysOfWeek convention used elsewhere (ScheduleEvent, mock calendar data). */
export function startOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - d.getDay());
  return toLocalDateString(d);
}
