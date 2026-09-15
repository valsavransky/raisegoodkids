import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SetupStackParamList } from './types';
import { WelcomeScreen } from '../screens/setup/WelcomeScreen';
import { ChildProfileScreen } from '../screens/setup/ChildProfileScreen';
import { LoginScreen } from '../screens/setup/LoginScreen';
import { ScheduleImportScreen } from '../screens/setup/ScheduleImportScreen';
import { GoogleCalendarPickerScreen } from '../screens/setup/GoogleCalendarPickerScreen';
import { GoogleCalendarEventsScreen } from '../screens/setup/GoogleCalendarEventsScreen';
import { ScheduleReviewScreen } from '../screens/setup/ScheduleReviewScreen';
import { ExpectedSetupScreen } from '../screens/setup/ExpectedSetupScreen';
import { GigsSetupScreen } from '../screens/setup/GigsSetupScreen';

const Stack = createNativeStackNavigator<SetupStackParamList>();

export function SetupNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ChildProfile" component={ChildProfileScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ScheduleImport" component={ScheduleImportScreen} />
      <Stack.Screen name="GoogleCalendarPicker" component={GoogleCalendarPickerScreen} />
      <Stack.Screen name="GoogleCalendarEvents" component={GoogleCalendarEventsScreen} />
      <Stack.Screen name="ScheduleReview" component={ScheduleReviewScreen} />
      <Stack.Screen name="ExpectedSetup" component={ExpectedSetupScreen} />
      <Stack.Screen name="GigsSetup" component={GigsSetupScreen} />
    </Stack.Navigator>
  );
}
