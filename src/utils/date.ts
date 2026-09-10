export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
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
