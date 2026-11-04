// Screen 12: goal achieved — celebration (kid-facing). The biggest moment in
// the app, per docs/screens-and-flows.md — bigger and more elaborate than a
// standard badge unlock.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { markCelebrated, wasAwayFor } from '../../utils/childCelebrations';
import { Confetti } from '../../components/Confetti';
import { playSound } from '../../services/sound';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalAchieved'>;

export function GoalAchievedScreen({ route, navigation }: Props) {
  const { goalId, celebrationId } = route.params;
  // On a family device it counts as seen once this screen is closed, however it was closed.
  useEffect(
    () => () => {
      if (celebrationId) markCelebrated(celebrationId);
    },
    [celebrationId]
  );
  const { getGoal, activeGoal, deviceMode, childProfiles, markGoalFulfilled } = useAppData();
  const goal = getGoal(goalId);
  const childFirstName = childProfiles.find((c) => c.id === goal?.childProfileId)?.name.trim().split(/\s+/)[0] || 'They';
  const backToToday = () => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  // The next queued goal auto-activates the moment this one is achieved
  // (see AppDataContext.markGigDone), so by the time this screen renders
  // it's already the active goal, not still sitting in the queue.
  const nextUp = activeGoal();

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  // Temporary: shows what the audio player is doing, to track down a silent fanfare.
  const [soundDebug, setSoundDebug] = useState('');
  const trophyScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(trophyScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    setConfettiTrigger((n) => n + 1);
  }, [trophyScale]);

  const playFanfare = () => {
    // The child tapped "Play the fanfare", so it plays even if the family's sound setting is off.
    setSoundDebug('starting…');
    playSound('fanfare', true, (t) => setSoundDebug((prev) => `${prev}\n${t}`.split('\n').slice(-8).join('\n')));
    setConfettiTrigger((n) => n + 1);
  };

  return (
    <View style={styles.screen}>
      <Confetti trigger={confettiTrigger} />

      <Animated.Text style={[styles.trophy, { transform: [{ scale: trophyScale }] }]}>🏆</Animated.Text>

      {wasAwayFor(route.params.whenIso) && <Text style={styles.awayKicker}>🌙 While you were away…</Text>}
      <Text style={styles.title}>{deviceMode ? 'You did it!' : `${childFirstName} did it!`}</Text>
      <Text style={styles.goalName}>{goal ? `${goal.name} is yours` : 'Goal reached'}</Text>

      <Pressable style={styles.fanfareButton} onPress={playFanfare}>
        <Text style={styles.fanfareButtonText}>🔊 Play the fanfare</Text>
      </Pressable>
      {soundDebug ? <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>{soundDebug}</Text> : null}

      <Text style={styles.grownUpNote}>
        {deviceMode ? 'Ask a grown-up to make it happen!' : 'Tap below once you’ve fulfilled it in real life.'}
      </Text>

      {nextUp && (
        <View style={styles.nextUpCard}>
          <Text style={styles.nextUpLabel}>Up next</Text>
          <Text style={styles.nextUpName}>{nextUp.name}</Text>
        </View>
      )}

      {deviceMode ? (
        <Pressable style={styles.continueButton} onPress={() => navigation.goBack()}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      ) : (
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              markGoalFulfilled(goalId);
              backToToday();
            }}
          >
            <Text style={styles.primaryButtonText}>Mark as fulfilled</Text>
          </Pressable>
          <Pressable style={styles.ghostButton} onPress={backToToday}>
            <Text style={styles.ghostButtonText}>I’ll do this later</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  trophy: { fontSize: 80, marginBottom: 16 },
  awayKicker: { fontSize: 15, fontWeight: '700', color: colors.gigs, marginBottom: 8, textAlign: 'center' },
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
  // Same buttons as the pop-up sheets: a clear main action and a quiet way out.
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 28 },
  primaryButton: { backgroundColor: colors.expected, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ghostButton: { backgroundColor: '#F3F1EC', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  ghostButtonText: { color: '#4B4F58', fontSize: 16, fontWeight: '800' },
  continueButton: {
    marginTop: 32,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
