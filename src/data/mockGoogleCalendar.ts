// STUBBED DATA — not a real Google Calendar API call. Lets the calendar
// connect/select/import UX be built and tested in Expo Go now; swap this
// module for a real Calendar API client once OAuth is wired up (needs a
// Google Cloud OAuth client + moving off plain Expo Go to a custom dev
// build for a reliable redirect — see conversation with the user).
export interface MockCalendar {
  id: string;
  name: string;
}

export interface MockRecurringEvent {
  id: string;
  calendarId: string;
  title: string;
  daysOfWeek: number[]; // 0=Sunday..6=Saturday
  startTime: string;
  endTime: string;
}

export const MOCK_CALENDARS: MockCalendar[] = [
  { id: 'cal-school', name: "Emma's School" },
  { id: 'cal-family', name: 'Family' },
];

export const MOCK_RECURRING_EVENTS: MockRecurringEvent[] = [
  { id: 'evt-piano', calendarId: 'cal-school', title: 'Piano Lesson', daysOfWeek: [2], startTime: '16:00', endTime: '17:00' },
  { id: 'evt-soccer', calendarId: 'cal-school', title: 'Soccer Practice', daysOfWeek: [1, 3], startTime: '17:00', endTime: '18:00' },
  { id: 'evt-tutoring', calendarId: 'cal-school', title: 'Math Tutoring', daysOfWeek: [4], startTime: '15:30', endTime: '16:30' },
  { id: 'evt-dinner', calendarId: 'cal-family', title: 'Family Dinner', daysOfWeek: [0], startTime: '18:00', endTime: '19:00' },
];

export function getMockEventsForCalendar(calendarId: string): MockRecurringEvent[] {
  return MOCK_RECURRING_EVENTS.filter((e) => e.calendarId === calendarId);
}
