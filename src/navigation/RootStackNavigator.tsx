// Wraps the bottom-tab app (MainNavigator) with modal-presented screens that
// don't belong in the tab bar — the goal-achieved celebration and the
// parent's fulfillment prompt (screens 12-13).
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainNavigator } from './MainNavigator';
import { GoalAchievedScreen } from '../screens/child/GoalAchievedScreen';
import { FulfillGoalScreen } from '../screens/parent/FulfillGoalScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainNavigator} />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
        <Stack.Screen name="GoalAchieved" component={GoalAchievedScreen} />
        <Stack.Screen name="FulfillGoal" component={FulfillGoalScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
