// Screen 2: child home screen — the primary daily screen, "Today's Trail."
// Kid-facing voice is playful and exclamatory (see docs/screens-and-flows.md,
// "Dual voice"). Redesigned from a plain checklist into a winding path the
// selected avatar advances along as tasks complete — see the "Whimsical
// Today view" priority and the Trail Path mockup this was built from.
//
// Gigs are marked done directly by the parent during check-in and count
// toward goal progress immediately — no separate approval queue, since
// there's only one user type (parent) and they're present for the session.
//
// Gigs are no longer hard-locked behind finishing today's Expected items —
// some Expected items are legitimately impossible on a given day (nothing
// to set the table for, no dishes to put away), and a hard lock had no way
// to tell the difference from actually skipped chores. Instead, a Gig stop
// looks exactly like any other not-done stop (no lock icon, no dimming) —
// starting one while Expected items are outstanding just asks the parent to
// confirm, putting that judgment call where it belongs (the present parent)
// rather than enforcing it structurally either visually or functionally.
//
// Weekly Expected items deliberately do NOT appear on the trail itself — a
// full chore-x-day grid for them is still a later, tabled decision (see the
// priorities doc, "Weekly grid/matrix view"). In the meantime a small
// "Today" / "This Week" toggle swaps the trail out for a simple row of
// stepping-stone chips (same icon/ring visual language as trail stops)
// instead of stacking both on one screen — closer to the "separate path"
// weekly items were always meant to get, without the avatar-advancement
// mechanics that belong to the full grid view.
//
// The "what's on today" schedule strip re-derives today's events (and their
// past/next/upcoming status) on every screen focus rather than keeping a
// live-ticking clock — precise enough for a glance-at-it-during-check-in
// use case, without the battery/complexity cost of a real-time timer.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet, Image, Animated } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../../context/AppDataContext';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { ExpectedItem, Gig, ScheduleEventCategory } from '../../types/models';
import { AppHeader } from '../../components/AppHeader';
import { AvatarGlyph } from '../../components/AvatarGlyph';
import { TaskIcon } from '../../components/icons/TaskIcons';
import { guessTaskIcon } from '../../data/taskIcons';
import { scheduleEventsForToday, formatEventTimeRange, TodayScheduleEvent } from '../../data/schedule';
import { playSound } from '../../services/sound';
import { colors } from '../../theme/colors';

const CATEGORY_ICONS: Record<ScheduleEventCategory, string> = {
  school: '🏫',
  sports: '⚽',
  extracurricular: '🎭',
  music: '🎵',
  other: '📌',
};

type ChildHomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Trail geometry — a fixed two-column zigzag (alternating x, descending y),
// same as the mockup. A fixed illustration width (350, centered) rather
// than a percentage layout, since this is a deliberate zigzag shape, not a
// fluid one; comfortably fits standard phone widths (390+).
const TRAIL_WIDTH = 350;
const COLUMN_X: [number, number] = [66, 284];
const STEP_Y = 78;
// Tall enough that the avatar — which floats above the first point by
// AVATAR_SIZE + 26 (see avatarWrap's marginTop) — stays fully inside the
// trail area instead of overlapping the label/toggle row above it.
const FIRST_Y = 100;
const AVATAR_SIZE = 72;
const STOP_SIZE = 50;

type TrailStop =
  | { kind: 'expected'; id: string; name: string; done: boolean }
  | { kind: 'gig'; id: string; name: string; percentage: number | null; done: boolean };

function trailPointAt(index: number): { x: number; y: number } {
  return { x: COLUMN_X[index % 2], y: FIRST_Y + index * STEP_Y };
}

function pathThrough(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return 'M' + points.map((p) => `${p.x},${p.y}`).join(' L');
}

const SPARKLE_COLORS = [colors.futureFund, colors.character, colors.gigs];
const STAR_PATH = 'M12 2 l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z';

function Sparkle({ color, size, style, delay }: { color: string; size: number; style: object; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 800, delay, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);

  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.15] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={STAR_PATH} fill={color} />
      </Svg>
    </Animated.View>
  );
}

export function ChildHomeScreen() {
  const navigation = useNavigation<ChildHomeNavigationProp>();
  const {
    childProfile,
    expectedItems,
    isExpectedDoneToday,
    markExpectedDone,
    allExpectedDoneToday,
    expectedDoneCountToday,
    activeGoal,
    goalProgressPercentage,
    gigs,
    gigPreviewPercentage,
    gigCompletionStatusToday,
    markGigDone,
    soundEnabled,
    expectedStreak,
    scheduleEvents,
  } = useAppData();

  const [view, setView] = useState<'today' | 'week'>('today');

  const [focusedAt, setFocusedAt] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setFocusedAt(Date.now());
    }, [])
  );
  const todaysEvents = useMemo(() => scheduleEventsForToday(scheduleEvents), [scheduleEvents, focusedAt]);
  const todayLabel = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'long' }), [focusedAt]);

  const celebrateCheckoff = () => {
    playSound('checkoff', soundEnabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // A gig means real earnings toward the goal — a stronger "success" haptic
  // and a brighter, distinct chime than the plain Expected checkoff above.
  const celebrateGig = () => {
    playSound('gigComplete', soundEnabled);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const goal = activeGoal();
  const { done, total } = expectedDoneCountToday();
  const gigsUnlocked = allExpectedDoneToday();
  const streak = expectedStreak();
  const dailyItems = expectedItems.filter((item) => item.frequency === 'daily');
  const weeklyItems = expectedItems.filter((item) => item.frequency === 'weekly');

  const stops: TrailStop[] = [
    ...dailyItems.map((item): TrailStop => ({ kind: 'expected', id: item.id, name: item.name, done: isExpectedDoneToday(item.id) })),
    ...gigs.map((gig): TrailStop => ({
      kind: 'gig',
      id: gig.id,
      name: gig.name,
      percentage: gigPreviewPercentage(gig),
      done: gigCompletionStatusToday(gig.id) === 'approved',
    })),
  ];

  const points = stops.map((_, i) => trailPointAt(i));
  const doneCount = stops.filter((s) => s.done).length;
  const shownProgress = Math.max(doneCount, stops.length > 0 ? 1 : 0);
  const avatarIdx = Math.min(doneCount, Math.max(points.length - 1, 0));
  const avatarPoint = points[avatarIdx] ?? trailPointAt(0);
  const trailHeight = points.length > 0 ? FIRST_Y + (points.length - 1) * STEP_Y + 70 : 0;
  const gigsDoneToday = gigs.some((gig) => gigCompletionStatusToday(gig.id) === 'approved');

  const avatarTranslate = useRef(new Animated.ValueXY({ x: avatarPoint.x, y: avatarPoint.y })).current;
  useEffect(() => {
    Animated.spring(avatarTranslate, {
      toValue: { x: avatarPoint.x, y: avatarPoint.y },
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarPoint.x, avatarPoint.y]);

  const handleExpectedPress = (itemId: string) => {
    celebrateCheckoff();
    const { newBadgeCatalogId, allDoneToday, allWeeklyDoneThisWeek } = markExpectedDone(itemId);
    if (allDoneToday) {
      navigation.navigate('AllExpectedDone', { badgeCatalogId: newBadgeCatalogId ?? undefined });
    } else if (allWeeklyDoneThisWeek) {
      navigation.navigate('AllWeeklyExpectedDone', { badgeCatalogId: newBadgeCatalogId ?? undefined });
    } else if (newBadgeCatalogId) {
      navigation.navigate('BadgeUnlock', { catalogId: newBadgeCatalogId });
    }
  };

  const handleGigPress = (gig: Gig) => {
    if (!goal) return;
    const activeGoalId = goal.id;
    const startGig = () => {
      celebrateGig();
      const { achievedGoal, newBadgeCatalogId, allGigsDoneToday } = markGigDone(gig.id);
      if (achievedGoal) {
        navigation.navigate('GoalAchieved', { goalId: activeGoalId });
      } else if (allGigsDoneToday) {
        navigation.navigate('AllGigsDone', { badgeCatalogId: newBadgeCatalogId ?? undefined });
      } else if (newBadgeCatalogId) {
        navigation.navigate('BadgeUnlock', { catalogId: newBadgeCatalogId });
      }
    };
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
  };

  return (
    <View style={styles.screen}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Pattern id="dotTexture" width={18} height={18} patternUnits="userSpaceOnUse">
            <Circle cx={9} cy={9} r={1.5} fill="rgba(20,20,19,0.055)" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dotTexture)" />
      </Svg>

      <View style={styles.fixedHeader}>
        <AppHeader />

        <View style={styles.goalCardWrapper}>
          {!goal ? (
            <Pressable style={styles.emptyGoalCard} onPress={() => navigation.navigate('Goal')}>
              <Text style={styles.emptyGoalIcon}>🎯</Text>
              <Text style={styles.emptyGoalText}>Pick a goal to start earning!</Text>
              <Text style={styles.emptyGoalChevron}>{'›'}</Text>
            </Pressable>
          ) : (
            <View style={styles.goalCard}>
              <View style={styles.goalTitleRow}>
                {goal.photoUri && <Image source={{ uri: goal.photoUri }} style={styles.goalPhoto} />}
                <Text style={styles.goalName}>{goal.name}</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${Math.min(goalProgressPercentage(goal.id), 100)}%` }]} />
              </View>
              <Text style={styles.goalProgressText}>{Math.min(goalProgressPercentage(goal.id), 100)}% there</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.viewToggleRow}>
          <View style={styles.toggleTabs}>
            <Pressable
              onPress={() => setView('today')}
              style={[styles.toggleTab, view === 'today' && styles.toggleTabActive]}
            >
              <Text style={[styles.toggleTabText, view === 'today' && styles.toggleTabTextActive]}>Today</Text>
            </Pressable>
            {weeklyItems.length > 0 && (
              <Pressable
                onPress={() => setView('week')}
                style={[styles.toggleTab, view === 'week' && styles.toggleTabActive]}
              >
                <Text style={[styles.toggleTabText, view === 'week' && styles.toggleTabTextActive]}>This Week</Text>
              </Pressable>
            )}
          </View>
          {view === 'today' && <Text style={styles.streakText}>{streak}-day streak</Text>}
        </View>

        {view === 'today' && todaysEvents.length > 0 && (
          <View style={styles.scheduleStrip}>
            <Text style={styles.scheduleDayLabel}>{todayLabel}</Text>
            {todaysEvents.map((event: TodayScheduleEvent) => (
              <View
                key={event.id}
                style={[styles.scheduleRow, event.status === 'next' && styles.scheduleRowNext]}
              >
                <Text style={styles.scheduleIcon}>{CATEGORY_ICONS[event.category]}</Text>
                <Text
                  style={[
                    styles.scheduleTitle,
                    event.status === 'next' && styles.scheduleTitleNext,
                    event.status === 'past' && styles.scheduleTitlePast,
                  ]}
                  numberOfLines={1}
                >
                  {event.title}
                </Text>
                {formatEventTimeRange(event) && (
                  <Text style={[styles.scheduleTime, event.status === 'past' && styles.scheduleTitlePast]}>
                    {formatEventTimeRange(event)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {view === 'today' && stops.length > 0 && (
          <View style={[styles.trailArea, { height: trailHeight }]}>
            <Svg width={TRAIL_WIDTH} height={trailHeight} style={StyleSheet.absoluteFill}>
              <Path d={pathThrough(points)} stroke="#E7DCC7" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path
                d={pathThrough(points.slice(0, shownProgress))}
                stroke={colors.expected}
                strokeWidth={7}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>

            <Animated.View
              style={[
                styles.avatarWrap,
                { transform: [{ translateX: avatarTranslate.x }, { translateY: avatarTranslate.y }] },
              ]}
              pointerEvents="none"
            >
              <AvatarGlyph avatarId={childProfile?.avatarId} size={AVATAR_SIZE} />
              {gigsDoneToday && (
                <>
                  <Sparkle color={SPARKLE_COLORS[0]} size={16} delay={0} style={styles.sparkleA} />
                  <Sparkle color={SPARKLE_COLORS[1]} size={12} delay={400} style={styles.sparkleB} />
                  <Sparkle color={SPARKLE_COLORS[2]} size={13} delay={800} style={styles.sparkleC} />
                </>
              )}
            </Animated.View>

            {stops.map((stop, i) => {
              const point = points[i];
              const categoryColor = stop.kind === 'gig' ? colors.gigs : colors.expected;
              // Not-done rings are category-tinted too, not one shared
              // neutral — otherwise an undone Expected and an undone Gig
              // are indistinguishable until the moment they're completed.
              const mutedRingColor = stop.kind === 'gig' ? '#E9CB9A' : '#B7D9D3';
              const ringColor = stop.done ? categoryColor : mutedRingColor;
              const bgColor = stop.done ? categoryColor : '#FFFFFF';
              const iconColor = stop.done ? '#FFFFFF' : '#B3AA96';
              return (
                <View key={`${stop.kind}-${stop.id}`}>
                  <Pressable
                    disabled={stop.done}
                    onPress={() =>
                      stop.kind === 'expected'
                        ? handleExpectedPress(stop.id)
                        : handleGigPress(gigs.find((g) => g.id === stop.id)!)
                    }
                    style={[
                      styles.stopButton,
                      { left: point.x - STOP_SIZE / 2, top: point.y - STOP_SIZE / 2, borderColor: ringColor, backgroundColor: bgColor },
                    ]}
                  >
                    <TaskIcon name={guessTaskIcon(stop.name)} size={22} color={iconColor} />
                  </Pressable>
                  <View style={[styles.stopLabelWrap, { left: point.x - 52, top: point.y + 32 }]}>
                    <Text style={styles.stopLabel}>{stop.name}</Text>
                    {stop.kind === 'gig' && stop.percentage !== null && (
                      <Text style={styles.stopAmount}>+{stop.percentage}%</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {view === 'today' && (
          <Text style={styles.doneCaption}>
            {done + gigs.filter((g) => gigCompletionStatusToday(g.id) === 'approved').length} of {stops.length} done today
          </Text>
        )}

        {view === 'week' && (
          <View style={styles.weeklyPanel}>
            <View style={styles.weeklyRow}>
              {weeklyItems.map((item: ExpectedItem) => {
                const itemDone = isExpectedDoneToday(item.id);
                const ringColor = itemDone ? colors.expected : '#B7D9D3';
                const bgColor = itemDone ? colors.expected : '#FFFFFF';
                const iconColor = itemDone ? '#FFFFFF' : '#B3AA96';
                return (
                  <Pressable
                    key={item.id}
                    disabled={itemDone}
                    onPress={() => handleExpectedPress(item.id)}
                    style={styles.weeklyStop}
                  >
                    <View style={[styles.weeklyStopCircle, { borderColor: ringColor, backgroundColor: bgColor }]}>
                      <TaskIcon name={guessTaskIcon(item.name)} size={18} color={iconColor} />
                    </View>
                    <Text style={styles.weeklyStopLabel} numberOfLines={2}>{item.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F0' },
  fixedHeader: { paddingBottom: 12, backgroundColor: '#FFF8F0' },
  goalCardWrapper: { paddingHorizontal: 20 },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  emptyGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.gigs,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  emptyGoalIcon: { fontSize: 20 },
  emptyGoalText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  emptyGoalChevron: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  goalCard: { backgroundColor: '#FDF1E2', borderRadius: 20, padding: 16, marginBottom: 4 },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 11 },
  goalPhoto: { width: 36, height: 36, borderRadius: 9 },
  goalName: { fontSize: 16, fontWeight: '800', color: colors.text },
  progressBarTrack: { height: 9, borderRadius: 999, backgroundColor: '#F7DFC0', overflow: 'hidden' },
  progressBarFill: { height: 9, borderRadius: 999, backgroundColor: colors.gigs },
  goalProgressText: { fontSize: 12.5, color: '#B96A08', marginTop: 7, fontWeight: '600' },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  toggleTabs: { flexDirection: 'row', backgroundColor: '#F3EEE2', borderRadius: 999, padding: 3 },
  toggleTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 },
  toggleTabActive: { backgroundColor: colors.expected },
  toggleTabText: { fontSize: 12.5, fontWeight: '800', color: '#8a8578' },
  toggleTabTextActive: { color: '#FFFFFF' },
  streakText: { fontSize: 12.5, color: colors.expected, fontWeight: '700' },
  scheduleStrip: { paddingHorizontal: 20, marginBottom: 6 },
  scheduleDayLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  scheduleRowNext: { backgroundColor: '#FDF1E2' },
  scheduleIcon: { fontSize: 14 },
  scheduleTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  scheduleTitleNext: { fontWeight: '800', color: '#B96A08' },
  scheduleTitlePast: { color: colors.textMuted, fontWeight: '500' },
  scheduleTime: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  trailArea: { width: TRAIL_WIDTH, alignSelf: 'center', marginTop: 10 },
  avatarWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginLeft: -AVATAR_SIZE / 2,
    marginTop: -AVATAR_SIZE - 26,
  },
  sparkleA: { position: 'absolute', top: -10, left: -16 },
  sparkleB: { position: 'absolute', top: -2, right: -18 },
  sparkleC: { position: 'absolute', bottom: -8, left: 6 },
  stopButton: {
    position: 'absolute',
    width: STOP_SIZE,
    height: STOP_SIZE,
    borderRadius: STOP_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopLabelWrap: { position: 'absolute', width: 104, alignItems: 'center' },
  stopLabel: { fontWeight: '700', fontSize: 11, color: '#5c574b', textAlign: 'center', lineHeight: 14 },
  stopAmount: { fontWeight: '800', fontSize: 10, color: '#B96A08', marginTop: 1 },
  doneCaption: { textAlign: 'center', fontWeight: '600', fontSize: 13, color: '#8a8578', marginTop: 8, marginBottom: 4 },
  weeklyPanel: { paddingHorizontal: 20, paddingTop: 4 },
  weeklyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  weeklyStop: { width: 68, alignItems: 'center' },
  weeklyStopCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyStopLabel: {
    fontWeight: '700',
    fontSize: 10.5,
    color: '#5c574b',
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 5,
  },
});
