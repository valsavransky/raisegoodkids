import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SetupStackParamList } from './types';
import { ChildProfileScreen } from '../screens/setup/ChildProfileScreen';
import { ScheduleImportScreen } from '../screens/setup/ScheduleImportScreen';
import { ScheduleReviewScreen } from '../screens/setup/ScheduleReviewScreen';
import { ExpectedGigsSetupScreen } from '../screens/setup/ExpectedGigsSetupScreen';
import { SetupCompleteScreen } from '../screens/setup/SetupCompleteScreen';

const Stack = createNativeStackNavigator<SetupStackParamList>();

export function SetupNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChildProfile" component={ChildProfileScreen} />
      <Stack.Screen name="ScheduleImport" component={ScheduleImportScreen} />
      <Stack.Screen name="ScheduleReview" component={ScheduleReviewScreen} />
      <Stack.Screen name="ExpectedGigsSetup" component={ExpectedGigsSetupScreen} />
      <Stack.Screen name="SetupComplete" component={SetupCompleteScreen} />
    </Stack.Navigator>
  );
}
