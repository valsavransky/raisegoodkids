export type SetupStackParamList = {
  ChildProfile: undefined;
  ScheduleImport: undefined;
  GoogleCalendarPicker: undefined;
  GoogleCalendarEvents: { calendarId: string };
  ScheduleReview: undefined;
  ExpectedGigsSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Goal: undefined;
  Schedule: undefined;
  Badges: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  GoalAchieved: { goalId: string };
  FulfillGoal: { goalId: string };
  BadgeUnlock: { catalogId: string };
  ImportGoogleCalendar: undefined;
  ImportGoogleCalendarEvents: { calendarId: string };
};
