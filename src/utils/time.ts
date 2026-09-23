// Shared HH:MM (24-hour, as stored on ScheduleEvent) <-> Date <-> 12-hour
// display helpers, used by the schedule event form (native time picker)
// and by any screen listing events, so both read the same clock format.
export function timeStringToDate(hhmm: string): Date {
  const d = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(Number.isFinite(h) ? h : 15, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

export function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatTime12h(hhmm: string): string {
  return timeStringToDate(hhmm).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatTimeRange12h(startTime?: string, endTime?: string): string | null {
  if (!startTime) return null;
  return endTime ? `${formatTime12h(startTime)}–${formatTime12h(endTime)}` : formatTime12h(startTime);
}
