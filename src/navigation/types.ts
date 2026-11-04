export type SetupStackParamList = {
  WhoFor: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SignUpEmail: undefined;
  ChildProfile: undefined;
  Login: undefined;
  ScheduleImport: undefined;
  GoogleCalendarPicker: undefined;
  GoogleCalendarEvents: { calendarId: string };
  ScheduleReview: undefined;
  ExpectedSetup: undefined;
  GigsSetup: undefined;
  FutureFundSetup: undefined;
  FamilyDeviceIntro: undefined;
  PairDevice: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Goal: undefined;
  Badges: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  GoalAchieved: { goalId: string; celebrationId?: string };
  FulfillGoal: { goalId: string };
  BadgeUnlock: { catalogId: string; celebrationId?: string };
  AllExpectedDone: { badgeCatalogId?: string };
  AllWeeklyExpectedDone: { badgeCatalogId?: string };
  AllGigsDone: { badgeCatalogId?: string };
  BirthdayCelebration: undefined;
  ImportGoogleCalendar: undefined;
  ImportGoogleCalendarEvents: { calendarId: string };
  Settings: undefined;
  ExpectedItemsSettings: undefined;
  GigsSettings: undefined;
  ScheduleSettings: undefined;
  ExcusedDaysSettings: { openAdd?: boolean } | undefined;
  FutureFundSettings: undefined;
  NotificationSettings: undefined;
  Feedback: undefined;
  AccountSettings: undefined;
  EditProfile: undefined;
  AddChild: undefined;
  History: undefined;
  HistoryWeek: { weekStart: string };
  Approvals: undefined;
  ApproveGoal: { submissionId: string };
  FamilyDevices: undefined;
};
