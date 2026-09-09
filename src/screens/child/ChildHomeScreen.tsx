// Screen 2: child home screen — the primary daily screen. Kid-facing voice
// is playful and exclamatory (see docs/screens-and-flows.md, "Dual voice").
//
// Gigs are marked done directly by the parent during check-in and count
// toward goal progress immediately — no separate approval queue, since
// there's only one user type (parent) and they're present for the session.
import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAppData } from '../../context/AppDataContext';
import { MainTabParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

const AVATAR_EMOJI: Record<string, string> = {
  'avatar-1': '🦊',
  'avatar-2': '🐱',
  'avatar-3': '🐼',
  'avatar-4': '🐸',
  'avatar-5': '🦁',
};

export function ChildHomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const {
    childProfile,
    expectedItems,
    isExpectedDoneToday,
    markExpectedDone,
    allExpectedDoneToday,
    expectedDoneCountToday,
    expectedStreak,
    activeGoal,
    goalProgressPercentage,
    gigs,
    gigPreviewPercentage,
    gigCompletionStatusToday,
    markGigDone,
  } = useAppData();

  const goal = activeGoal();
  const { done, total } = expectedDoneCountToday();
  const gigsUnlocked = allExpectedDoneToday();
  const streak = expectedStreak();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>badge</Text>
        <Text style={styles.avatar}>{AVATAR_EMOJI[childProfile?.avatarId ?? ''] ?? '🙂'}</Text>
      </View>

      {!goal ? (
        <Pressable style={styles.emptyGoalCard} onPress={() => navigation.navigate('Goal')}>
          <Text style={styles.emptyGoalText}>Pick a goal to start earning!</Text>
        </Pressable>
      ) : (
        <View style={styles.goalCard}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.min(goalProgressPercentage(goal.id), 100)}%` }]} />
          </View>
          <Text style={styles.goalProgressText}>{goalProgressPercentage(goal.id)}% there</Text>
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionIcon, { color: colors.expected }]}>🔥</Text>
        <Text style={styles.sectionHeader}>Expected today</Text>
        <Text style={styles.streakText}>{streak}-day streak</Text>
      </View>

      <FlatList
        data={expectedItems}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isDone = isExpectedDoneToday(item.id);
          return (
            <Pressable
              style={styles.expectedRow}
              disabled={isDone}
              onPress={() => markExpectedDone(item.id)}
            >
              <View style={[styles.circle, isDone && styles.circleDone]} />
              <Text style={[styles.expectedName, isDone && styles.expectedNameDone]}>{item.name}</Text>
            </Pressable>
          );
        }}
      />

      {goal && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionIcon, { color: colors.gigs }]}>🪙</Text>
            <Text style={styles.sectionHeader}>Gigs available</Text>
          </View>

          {!gigsUnlocked ? (
            <View style={styles.lockedCard}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockedText}>Finish today's Expected to unlock gigs!</Text>
              <Text style={styles.lockedProgress}>
                {done} of {total} done
              </Text>
            </View>
          ) : (
            <FlatList
              data={gigs}
              keyExtractor={(gig) => gig.id}
              scrollEnabled={false}
              renderItem={({ item: gig }) => {
                const status = gigCompletionStatusToday(gig.id);
                const percentage = gigPreviewPercentage(gig);
                return (
                  <Pressable
                    style={styles.gigRow}
                    disabled={status !== null}
                    onPress={() => markGigDone(gig.id)}
                  >
                    <Text style={styles.gigCoin}>🪙</Text>
                    <Text style={[styles.gigName, status !== null && styles.gigNameDone]}>{gig.name}</Text>
                    <Text style={styles.gigPercentage}>{status === 'approved' ? 'Done ✓' : `+${percentage}%`}</Text>
                  </Pressable>
                );
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  wordmark: { fontSize: 22, fontWeight: '800', color: colors.text },
  avatar: { fontSize: 28 },
  emptyGoalCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyGoalText: { fontSize: 16, fontWeight: '700', color: colors.gigs },
  goalCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20 },
  goalName: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 },
  progressBarTrack: { height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  progressBarFill: { height: 10, borderRadius: 5, backgroundColor: colors.gigs },
  goalProgressText: { fontSize: 13, color: colors.textMuted, marginTop: 8, fontWeight: '600' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 10 },
  sectionIcon: { fontSize: 16 },
  sectionHeader: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  streakText: { fontSize: 13, color: colors.expected, fontWeight: '700' },
  expectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  circle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border },
  circleDone: { backgroundColor: colors.expected, borderColor: colors.expected },
  expectedName: { fontSize: 15, color: colors.text, flexShrink: 1 },
  expectedNameDone: { color: colors.textMuted },
  lockedCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 20, alignItems: 'center' },
  lockIcon: { fontSize: 28, marginBottom: 8 },
  lockedText: { fontSize: 15, fontWeight: '700', color: colors.text, textAlign: 'center' },
  lockedProgress: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  gigRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  gigCoin: { fontSize: 18 },
  gigName: { fontSize: 15, color: colors.text, flex: 1 },
  gigNameDone: { color: colors.textMuted },
  gigPercentage: { fontSize: 13, fontWeight: '700', color: colors.gigs },
});
