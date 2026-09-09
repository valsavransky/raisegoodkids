import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { ChildHomeScreen } from '../screens/child/ChildHomeScreen';
import { GoalPickerScreen } from '../screens/child/GoalPickerScreen';
import { ScheduleViewScreen } from '../screens/child/ScheduleViewScreen';
import { BadgesPlaceholderScreen } from '../screens/child/BadgesPlaceholderScreen';
import { colors } from '../theme/colors';

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: '🏠',
  Goal: '🎯',
  Schedule: '🗓️',
  Badges: '🏅',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.expected,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name as keyof MainTabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={ChildHomeScreen} />
      <Tab.Screen name="Goal" component={GoalPickerScreen} />
      <Tab.Screen name="Schedule" component={ScheduleViewScreen} />
      <Tab.Screen name="Badges" component={BadgesPlaceholderScreen} />
    </Tab.Navigator>
  );
}
