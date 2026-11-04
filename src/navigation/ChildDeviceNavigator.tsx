// What a family device shows: pick who you are, then the child's Today / Goal / Badges.
// No Settings, History or setup: those stay on the parent's phone.
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, AppState } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppData } from '../context/AppDataContext';
import { useDevice } from '../context/DeviceContext';
import { MainNavigator } from './MainNavigator';
import { RootStackParamList } from './types';
import { ChildPickerScreen } from '../screens/child/ChildPickerScreen';
import { GoalAchievedScreen } from '../screens/child/GoalAchievedScreen';
import { BadgeUnlockScreen } from '../screens/child/BadgeUnlockScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { colors } from '../theme/colors';

const IDLE_MS = 5 * 60 * 1000;

const Stack = createNativeStackNavigator<RootStackParamList>();

function Connecting() {
  const { refreshChildData } = useAppData();
  const { unpair } = useDevice();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Connecting to your family…</Text>
      <Text style={styles.body}>This needs the internet the first time.</Text>
      <Pressable style={styles.button} onPress={() => refreshChildData()}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
      <Pressable onPress={() => unpair()} hitSlop={8}>
        <Text style={styles.link}>Start over with a new code</Text>
      </Pressable>
    </View>
  );
}

export function ChildDeviceNavigator() {
  const { isHydrated, childProfile, childProfiles, deviceChildChosen, selectChild, forgetDeviceChild } = useAppData();

  // On a shared device, go back to "Who's using Trekker?" after a few minutes without a tap,
  // or after the screen has been off for that long, so the next child picks their own name.
  const lastTouch = useRef(Date.now());
  const wentAway = useRef<number | null>(null);
  const several = childProfiles.length > 1;
  useEffect(() => {
    if (!several || !deviceChildChosen) return;
    lastTouch.current = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - lastTouch.current > IDLE_MS) forgetDeviceChild();
    }, 20_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (wentAway.current !== null && Date.now() - wentAway.current > IDLE_MS) forgetDeviceChild();
        wentAway.current = null;
        lastTouch.current = Date.now();
      } else if (wentAway.current === null) {
        wentAway.current = Date.now();
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [several, deviceChildChosen]);

  // Only one child in the family: no need to ask.
  useEffect(() => {
    if (isHydrated && !deviceChildChosen && childProfiles.length === 1) selectChild(childProfiles[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, deviceChildChosen, childProfiles.length]);

  if (!isHydrated) return <LoadingScreen />;
  if (!childProfile) return <Connecting />;
  if (!deviceChildChosen) return childProfiles.length > 1 ? <ChildPickerScreen /> : <LoadingScreen />;
  return (
    <View style={{ flex: 1 }} onTouchStart={() => (lastTouch.current = Date.now())}>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainNavigator} />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
        <Stack.Screen name="BadgeUnlock" component={BadgeUnlockScreen} />
        <Stack.Screen name="GoalAchieved" component={GoalAchievedScreen} />
      </Stack.Group>
    </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { fontSize: 15, color: colors.textMuted, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  button: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { marginTop: 20, color: colors.textMuted, textDecorationLine: 'underline' },
});
