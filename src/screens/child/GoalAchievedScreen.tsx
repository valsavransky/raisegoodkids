// Screen 12: goal achieved — celebration (kid-facing). The biggest moment in
// the app, per docs/screens-and-flows.md — bigger and more elaborate than a
// standard badge unlock.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { Confetti } from '../../components/Confetti';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalAchieved'>;

export function GoalAchievedScreen({ route, navigation }: Props) {
  const { goalId } = route.params;
  const { getGoal, activeGoal } = useAppData();
  const goal = getGoal(goalId);
  // The next queued goal auto-activates the moment this one is achieved
  // (see AppDataContext.markGigDone), so by the time this screen renders
  // it's already the active goal, not still sitting in the queue.
  const nextUp = activeGoal();

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const trophyScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(trophyScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    setConfettiTrigger((n) => n + 1);
  }, [trophyScale]);

  const playFanfare = () => {
    // No audio asset wired up yet — replaying the confetti burst stands in
    // for the documented "ascending four-note chime" until one is added
    // (needs expo-av + a real sound file).
    setConfettiTrigger((n) => n + 1);
  };

  return (
    <View style={styles.screen}>
      <Confetti trigger={confettiTrigger} />

      <Animated.Text style={[styles.trophy, { transform: [{ scale: trophyScale }] }]}>🏆</Animated.Text>

      <Text style={styles.title}>You did it!</Text>
      <Text style={styles.goalName}>{goal ? `${goal.name} is yours` : 'Goal reached'}</Text>

      <Pressable style={styles.fanfareButton} onPress={playFanfare}>
        <Text style={styles.fanfareButtonText}>🔊 Play the fanfare</Text>
      </Pressable>

      <Text style={styles.grownUpNote}>Ask a grown-up to make it happen!</Text>

      {nextUp && (
        <View style={styles.nextUpCard}>
          <Text style={styles.nextUpLabel}>Up next</Text>
          <Text style={styles.nextUpName}>{nextUp.name}</Text>
        </View>
      )}

      <Pressable style={styles.continueButton} onPress={() => navigation.replace('FulfillGoal', { goalId })}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  trophy: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  goalName: { fontSize: 18, fontWeight: '600', color: colors.gigs, textAlign: 'center', marginTop: 8 },
  fanfareButton: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  fanfareButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  grownUpNote: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  nextUpCard: {
    marginTop: 28,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextUpLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  nextUpName: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  continueButton: {
    marginTop: 32,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
