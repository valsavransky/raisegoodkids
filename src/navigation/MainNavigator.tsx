import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { ChildHomeScreen } from '../screens/child/ChildHomeScreen';
import { GoalPickerScreen } from '../screens/child/GoalPickerScreen';
import { BadgesShelfScreen } from '../screens/child/BadgesShelfScreen';
import { colors } from '../theme/colors';

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Home: '🏠',
  Goal: '🎯',
  Badges: '🏅',
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  const { width, height } = useWindowDimensions();
  // A tablet held sideways gets a side rail instead of a bottom bar.
  const wide = width >= 900 && width > height;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarVariant: wide ? 'material' : 'uikit',
        tabBarActiveTintColor: colors.expected,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name as keyof MainTabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={ChildHomeScreen} options={{ tabBarLabel: 'Today' }} />
      <Tab.Screen name="Goal" component={GoalPickerScreen} />
      <Tab.Screen name="Badges" component={BadgesShelfScreen} />
    </Tab.Navigator>
  );
}
