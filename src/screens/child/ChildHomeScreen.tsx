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
import * as Haptics from 'expo-haptics';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../../context/AppDataContext';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { ExpectedItemRow } from '../../components/ExpectedItemRow';
import { GigItemRow } from '../../components/GigItemRow';
import { AppHeader } from '../../components/AppHeader';
import { HeartHandshakeIcon } from '../../components/icons/HeartHandshakeIcon';
import { playSound } from '../../services/sound';
import { colors } from '../../theme/colors';

type ChildHomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
    soundEnabled,
  } = useAppData();

  const celebrateCheckoff = () => {
    playSound('checkoff', soundEnabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goal = activeGoal();
  const { done, total } = expectedDoneCountToday();
  const gigsUnlocked = allExpectedDoneToday();
  const streak = expectedStreak();
  const dailyItems = expectedItems.filter((item) => item.frequency === 'daily');
  const weeklyItems = expectedItems.filter((item) => item.frequency === 'weekly');

  return (
    <View style={styles.screen}>
      <View style={styles.fixedHeader}>
        <AppHeader />

        <View style={styles.goalCardWrapper}>
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
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.sectionHeaderRow}>
        <HeartHandshakeIcon size={16} />
        <Text style={styles.sectionHeader}>Expected today</Text>
        <Text style={styles.streakText}>{streak}-day streak</Text>
      </View>

      {total > 0 && (
        <>
          <View style={styles.dailyProgressTrack}>
            {Array.from({ length: total }).map((_, i) => (
              <View key={i} style={[styles.dailyProgressSegment, i < done && styles.dailyProgressSegmentFilled]} />
            ))}
          </View>
          <Text style={styles.dailyProgressCaption}>
            {done} of {total} done today
          </Text>
        </>
      )}

      {dailyItems.length > 0 && (
        <>
          <Text style={styles.subSectionHeader}>Daily</Text>
          {dailyItems.map((item) => (
            <ExpectedItemRow
              key={item.id}
              name={item.name}
              isDone={isExpectedDoneToday(item.id)}
              onPress={() => {
                celebrateCheckoff();
                const { newBadgeCatalogId, allDoneToday } = markExpectedDone(item.id);
                if (allDoneToday) {
                  navigation.navigate('AllExpectedDone', { badgeCatalogId: newBadgeCatalogId ?? undefined });
                } else if (newBadgeCatalogId) {
                  navigation.navigate('BadgeUnlock', { catalogId: newBadgeCatalogId });
                }
              }}
            />
          ))}
        </>
      )}

      {weeklyItems.length > 0 && (
        <>
          <Text style={styles.subSectionHeader}>Weekly</Text>
          {weeklyItems.map((item) => (
            <ExpectedItemRow
              key={item.id}
              name={item.name}
              isDone={isExpectedDoneToday(item.id)}
              onPress={() => {
                celebrateCheckoff();
                const { newBadgeCatalogId, allDoneToday } = markExpectedDone(item.id);
                if (allDoneToday) {
                  navigation.navigate('AllExpectedDone', { badgeCatalogId: newBadgeCatalogId ?? undefined });
                } else if (newBadgeCatalogId) {
                  navigation.navigate('BadgeUnlock', { catalogId: newBadgeCatalogId });
                }
              }}
            />
          ))}
        </>
      )}

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
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  goalCardWrapper: { paddingHorizontal: 20 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
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
  dailyProgressTrack: { flexDirection: 'row', gap: 5, marginBottom: 6 },
  dailyProgressSegment: { flex: 1, height: 10, borderRadius: 4, backgroundColor: colors.border },
  dailyProgressSegmentFilled: { backgroundColor: colors.expected },
  dailyProgressCaption: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 12 },
  subSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 6,
  },
  expectedRemainingNote: { fontSize: 13, color: colors.textMuted, marginBottom: 8, fontWeight: '600' },
});
