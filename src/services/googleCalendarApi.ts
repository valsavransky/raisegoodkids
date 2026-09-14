// Thin wrapper over the Google Calendar API v3 REST endpoints. Deliberately
// only requests event id/title/start/end — see the privacy note on screen 5
// of docs/screens-and-flows.md ("only event titles and times are read,
// nothing else stored"). No attendees, descriptions, locations, or
// attachments are ever fetched or parsed. This is enforced by the
// `fields` parameter on each request below, independent of which OAuth
// scope is granted (see googleAuth.ts's SCOPE for why that's
// calendar.readonly, not the narrower calendar.events.readonly).
import { ScheduleEventCategory, ScheduleEventCadence } from '../types/models';
import { guessCategoryForTitle } from '../data/practiceSuggestions';

const API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface GoogleCalendarSummary {
  id: string;
  name: string;
}

export interface ImportedScheduleEvent {
  /** The recurringEventId for a grouped recurring event, or the event's own
   * id for a standalone one — stable enough to key a list and track
   * selection with. */
  id: string;
  title: string;
  category: ScheduleEventCategory;
  recurring: boolean;
  daysOfWeek?: number[];
  /** Only set when recurring — see fetchRecurrenceCadence for how this is
   * derived from the event's actual Google Calendar recurrence rule. */
  cadence?: ScheduleEventCadence;
  date?: string;
  startTime?: string;
  endTime?: string;
}

/** Thrown by googleFetch with the HTTP status attached, so callers can
 * tell an expired/revoked token (401 — should prompt reconnection) apart
 * from other failures (network issue, wrong scope, etc). */
export class GoogleApiError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`Google Calendar API request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

async function googleFetch<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    const body = await response.text().catch(() => '<could not read body>');
    throw new GoogleApiError(response.status, body);
  }
  return response.json();
}

export async function fetchCalendarList(accessToken: string): Promise<GoogleCalendarSummary[]> {
  const data = await googleFetch<{ items?: { id: string; summary: string }[] }>(
    `${API_BASE}/users/me/calendarList?minAccessRole=reader`,
    accessToken
  );
  return (data.items ?? []).map((item) => ({ id: item.id, name: item.summary }));
}

interface GoogleEventDateTime {
  date?: string; // all-day event, YYYY-MM-DD
  dateTime?: string; // timed event, ISO 8601 with offset
}

interface GoogleEventInstance {
  id: string;
  recurringEventId?: string;
  summary?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
}

/** Parses an event's start/end into a real Date for weekday extraction.
 * All-day dates need the explicit local-midnight suffix (matching
 * src/utils/date.ts's convention) so they don't shift a day backward in
 * negative-UTC-offset timezones when read back with getDay(). */
function toLocalDate(instance: GoogleEventDateTime | undefined): Date | undefined {
  if (!instance) return undefined;
  if (instance.dateTime) return new Date(instance.dateTime);
  if (instance.date) return new Date(`${instance.date}T00:00:00`);
  return undefined;
}

function toHHMM(instance: GoogleEventDateTime | undefined): string | undefined {
  if (!instance?.dateTime) return undefined;
  const d = new Date(instance.dateTime);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parses a Google Calendar RRULE (e.g. "RRULE:FREQ=WEEKLY;BYDAY=MO,WE" or
 * "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU") into our simplified cadence
 * buckets. Falls back to 'weekly' when there's no rule to read or it's in a
 * shape we don't recognize (e.g. a complex custom RRULE) — the overwhelming
 * majority of household recurring events (school, lessons, practice) repeat
 * weekly, so that's a safer default than leaving the cadence unlabeled. */
function parseCadence(recurrence: string[] | undefined): ScheduleEventCadence {
  const rule = recurrence?.find((r) => r.startsWith('RRULE'));
  if (!rule) return 'weekly';
  const freq = rule.match(/FREQ=([A-Z]+)/)?.[1];
  const interval = parseInt(rule.match(/INTERVAL=(\d+)/)?.[1] ?? '1', 10);
  switch (freq) {
    case 'DAILY':
      return 'daily';
    case 'WEEKLY':
      return interval >= 2 ? 'biweekly' : 'weekly';
    case 'MONTHLY':
      return 'monthly';
    case 'YEARLY':
      return 'yearly';
    default:
      return 'weekly';
  }
}

/** The expanded instances from the main events.list call don't carry the
 * series' RRULE (only its master event does), so this fetches just that one
 * field from the master event to find the real cadence. Best-effort: any
 * failure (including a 404 if the master event fell outside what
 * calendar.readonly can see) just falls back to 'weekly' rather than
 * failing the whole import. */
async function fetchRecurrenceCadence(
  accessToken: string,
  calendarId: string,
  recurringEventId: string
): Promise<ScheduleEventCadence> {
  try {
    const data = await googleFetch<{ recurrence?: string[] }>(
      `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(recurringEventId)}?fields=recurrence`,
      accessToken
    );
    return parseCadence(data.recurrence);
  } catch {
    return 'weekly';
  }
}

/**
 * Fetches events for a calendar over the given window, using
 * singleEvents=true so Google expands recurring series into individual
 * occurrences for us — this avoids parsing RRULE syntax ourselves.
 * Occurrences sharing a recurringEventId are grouped back into a single
 * recurring ImportedScheduleEvent (daysOfWeek = the set of weekdays its
 * occurrences fall on); everything else becomes a one-off event.
 */
export async function fetchImportableEvents(
  accessToken: string,
  calendarId: string,
  windowStart: Date,
  windowEnd: Date
): Promise<ImportedScheduleEvent[]> {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: windowStart.toISOString(),
    timeMax: windowEnd.toISOString(),
    maxResults: '250',
    fields: 'items(id,recurringEventId,summary,start,end)',
  });
  const data = await googleFetch<{ items?: GoogleEventInstance[] }>(
    `${API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    accessToken
  );
  const items = data.items ?? [];

  const recurringGroups = new Map<string, GoogleEventInstance[]>();
  const standalone: GoogleEventInstance[] = [];
  for (const item of items) {
    if (item.recurringEventId) {
      const group = recurringGroups.get(item.recurringEventId) ?? [];
      group.push(item);
      recurringGroups.set(item.recurringEventId, group);
    } else {
      standalone.push(item);
    }
  }

  const results: ImportedScheduleEvent[] = [];

  const recurringResults = await Promise.all(
    Array.from(recurringGroups.entries()).map(async ([recurringEventId, occurrences]) => {
      const first = occurrences[0];
      const title = first.summary ?? 'Untitled event';
      const daysOfWeek = Array.from(
        new Set(
          occurrences
            .map((o) => toLocalDate(o.start))
            .filter((d): d is Date => d !== undefined)
            .map((d) => d.getDay())
        )
      ).sort((a, b) => a - b);
      const cadence = await fetchRecurrenceCadence(accessToken, calendarId, recurringEventId);
      const event: ImportedScheduleEvent = {
        id: recurringEventId,
        title,
        category: guessCategoryForTitle(title),
        recurring: true,
        daysOfWeek,
        cadence,
        startTime: toHHMM(first.start),
        endTime: toHHMM(first.end),
      };
      return event;
    })
  );
  results.push(...recurringResults);

  for (const item of standalone) {
    const title = item.summary ?? 'Untitled event';
    const startDate = toLocalDate(item.start);
    results.push({
      id: item.id,
      title,
      category: guessCategoryForTitle(title),
      recurring: false,
      date: startDate ? toDateString(startDate) : undefined,
      startTime: toHHMM(item.start),
      endTime: toHHMM(item.end),
    });
  }

  return results;
}
