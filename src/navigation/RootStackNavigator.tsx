// Wraps the bottom-tab app (MainNavigator) with modal-presented screens that
// don't belong in the tab bar — the goal-achieved celebration and the
// parent's fulfillment prompt (screens 12-13).
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainNavigator } from './MainNavigator';
import { GoalAchievedScreen } from '../screens/child/GoalAchievedScreen';
import { FulfillGoalScreen } from '../screens/parent/FulfillGoalScreen';
import { BadgeUnlockScreen } from '../screens/child/BadgeUnlockScreen';
import { ImportGoogleCalendarScreen } from '../screens/child/ImportGoogleCalendarScreen';
import { ImportGoogleCalendarEventsScreen } from '../screens/child/ImportGoogleCalendarEventsScreen';
import { ManageExpectedGigsScreen } from '../screens/parent/ManageExpectedGigsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainNavigator} />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
        <Stack.Screen name="GoalAchieved" component={GoalAchievedScreen} />
        <Stack.Screen name="FulfillGoal" component={FulfillGoalScreen} />
        <Stack.Screen name="BadgeUnlock" component={BadgeUnlockScreen} />
      </Stack.Group>
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="ImportGoogleCalendar" component={ImportGoogleCalendarScreen} />
        <Stack.Screen name="ImportGoogleCalendarEvents" component={ImportGoogleCalendarEventsScreen} />
        <Stack.Screen name="ManageExpectedGigs" component={ManageExpectedGigsScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
