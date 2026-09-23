export type SetupStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  ChildProfile: undefined;
  Login: undefined;
  ScheduleImport: undefined;
  GoogleCalendarPicker: undefined;
  GoogleCalendarEvents: { calendarId: string };
  ScheduleReview: undefined;
  ExpectedSetup: undefined;
  GigsSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Goal: undefined;
  Badges: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  GoalAchieved: { goalId: string };
  FulfillGoal: { goalId: string };
  BadgeUnlock: { catalogId: string };
  AllExpectedDone: { badgeCatalogId?: string };
  AllWeeklyExpectedDone: { badgeCatalogId?: string };
  AllGigsDone: { badgeCatalogId?: string };
  ImportGoogleCalendar: undefined;
  ImportGoogleCalendarEvents: { calendarId: string };
  Settings: undefined;
  ExpectedItemsSettings: undefined;
  GigsSettings: undefined;
  ScheduleSettings: undefined;
  FutureFundSettings: undefined;
  AccountSettings: undefined;
  EditProfile: undefined;
};
