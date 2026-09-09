// Screen 2: child home screen — the primary daily screen. Kid-facing voice
// is playful and exclamatory (see docs/screens-and-flows.md, "Dual voice").
//
// Gigs are marked done directly by the parent during check-in and count
// toward goal progress immediately — no separate approval queue, since
// there's only one user type (parent) and they're present for the session.
//
// Gigs are no longer hard-locked behind finishing today's Expected items —
// some Expected items are legitimately impossible on a given day (nothing
// to set the table for, no dishes to put away), and a hard lock had no way
// to tell the difference from actually skipped chores. Instead, incomplete
// Expected items still show as a visible count, and starting a gig while
// some are outstanding asks the parent to confirm — putting that judgment
// call where it belongs (the present parent) rather than enforcing it
// structurally. See conversation for the "cheap solution" reasoning.
import React from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../../context/AppDataContext';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { ExpectedItemRow } from '../../components/ExpectedItemRow';
import { GigItemRow } from '../../components/GigItemRow';
import { colors } from '../../theme/colors';

type ChildHomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const AVATAR_EMOJI: Record<string, string> = {
  'avatar-1': '🦊',
  'avatar-2': '🐱',
  'avatar-3': '🐼',
  'avatar-4': '🐸',
  'avatar-5': '🦁',
};

export function ChildHomeScreen() {
  const navigation = useNavigation<ChildHomeNavigationProp>();
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
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>badge</Text>
          <View style={styles.headerRight}>
            <Text style={styles.avatar}>{AVATAR_EMOJI[childProfile?.avatarId ?? ''] ?? '🙂'}</Text>
            <Pressable onPress={() => navigation.navigate('ManageExpectedGigs')} hitSlop={12}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </Pressable>
          </View>
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
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionIcon, { color: colors.expected }]}>🔥</Text>
        <Text style={styles.sectionHeader}>Expected today</Text>
        <Text style={styles.streakText}>{streak}-day streak</Text>
      </View>

      {expectedItems.map((item) => (
        <ExpectedItemRow
          key={item.id}
          name={item.name}
          isDone={isExpectedDoneToday(item.id)}
          onPress={() => {
            const { newBadgeCatalogId, allDoneToday } = markExpectedDone(item.id);
            if (allDoneToday) {
              navigation.navigate('AllExpectedDone', { badgeCatalogId: newBadgeCatalogId ?? undefined });
            } else if (newBadgeCatalogId) {
              navigation.navigate('BadgeUnlock', { catalogId: newBadgeCatalogId });
            }
          }}
        />
      ))}

      {goal && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionIcon, { color: colors.gigs }]}>🪙</Text>
            <Text style={styles.sectionHeader}>Gigs available</Text>
          </View>

          {!gigsUnlocked && (
            <Text style={styles.expectedRemainingNote}>
              {total - done} Expected item{total - done === 1 ? '' : 's'} still to do today
            </Text>
          )}

          {gigs.map((gig) => {
            const status = gigCompletionStatusToday(gig.id);
            const startGig = () => {
              const achievedGoalId = goal.id;
              const { achievedGoal, newBadgeCatalogId } = markGigDone(gig.id);
              if (achievedGoal) {
                navigation.navigate('GoalAchieved', { goalId: achievedGoalId });
              } else if (newBadgeCatalogId) {
                navigation.navigate('BadgeUnlock', { catalogId: newBadgeCatalogId });
              }
            };
            return (
              <GigItemRow
                key={gig.id}
                name={gig.name}
                percentage={gigPreviewPercentage(gig)}
                isDone={status === 'approved'}
                onPress={() => {
                  if (gigsUnlocked) {
                    startGig();
                    return;
                  }
                  Alert.alert(
                    'Still some Expected left today',
                    `${childProfile?.name ?? 'Your child'} still has ${total - done} Expected item${
                      total - done === 1 ? '' : 's'
                    } left today. Let them start a gig anyway?`,
                    [
                      { text: 'Not yet', style: 'cancel' },
                      { text: 'Yes, let them', onPress: startGig },
                    ]
                  );
                }}
              />
            );
          })}
        </>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  wordmark: { fontSize: 22, fontWeight: '800', color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { fontSize: 28 },
  settingsIcon: { fontSize: 22 },
  emptyGoalCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyGoalText: { fontSize: 16, fontWeight: '700', color: colors.gigs },
  goalCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 },
  goalName: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 },
  progressBarTrack: { height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  progressBarFill: { height: 10, borderRadius: 5, backgroundColor: colors.gigs },
  goalProgressText: { fontSize: 13, color: colors.textMuted, marginTop: 8, fontWeight: '600' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 10 },
  sectionIcon: { fontSize: 16 },
  sectionHeader: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  streakText: { fontSize: 13, color: colors.expected, fontWeight: '700' },
  expectedRemainingNote: { fontSize: 13, color: colors.textMuted, marginBottom: 8, fontWeight: '600' },
});
