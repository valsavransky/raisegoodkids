export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
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
  return d.toISOString().slice(0, 10);
}

/** Sunday (0) of the week containing dateStr — the week-boundary convention
 * used for weekly Expected items, matching the 0=Sunday..6=Saturday
 * daysOfWeek convention used elsewhere (ScheduleEvent, mock calendar data). */
export function startOfWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}
