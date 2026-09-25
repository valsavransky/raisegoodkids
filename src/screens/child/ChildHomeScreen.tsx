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
// small "Today" / "This Week" toggle swaps the trail out for a real
// chore-x-day grid instead of stacking both on one screen. "This Week"
// itself further splits into Daily / Gigs / Weekly sub-tabs (weekSubTab) —
// they used to stack as three sections on one screen, which ran very long
// for a household with a lot of gigs; one category visible at a time keeps
// the screen a flat length no matter how many items get added. Daily items
// and Gigs share DailyGridSection's day-by-day grid (both are genuinely
// per-day things); Weekly items get their own block (WeeklyStopSection): a
// weekly item only ever needs ONE completion, on any day, so a row of seven
// mostly-empty grid cells read as if six days were still outstanding — a
// big Trail-style stop plus a status caption ("Done Thursday" / "Anytime
// this week") says the actual rule instead of a shape to interpret. Cells
// read from ExpectedCompletion/GigCompletion history (both are already
// date-stamped, so this is a pivot of existing data, no new state); only
// today's column/stop is tappable, since a completion always dates to today
// (see markExpectedDone/markGigDone) — past days are a read-only record,
// future days aren't markable yet.
//
// The "what's on today" schedule strip re-derives today's events (and their
// past/next/upcoming status) on every screen focus rather than keeping a
// live-ticking clock — precise enough for a glance-at-it-during-check-in
// use case, without the battery/complexity cost of a real-time timer.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet, Image, Animated } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../../context/AppDataContext';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { ExpectedItem, ExpectedCompletion, Gig, GigCompletion, ScheduleEventCategory } from '../../types/models';
import { AppHeader } from '../../components/AppHeader';
import { AvatarGlyph } from '../../components/AvatarGlyph';
import { TaskIcon } from '../../components/icons/TaskIcons';
import { guessTaskIcon } from '../../data/taskIcons';
import { scheduleEventsForToday, formatEventTimeRange, TodayScheduleEvent } from '../../data/schedule';
import { playSound } from '../../services/sound';
import { colors } from '../../theme/colors';
import { todayString, startOfWeek, addDays } from '../../utils/date';

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

const WEEKDAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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

// The "This Week" grid's Daily block — a plain pivot of ExpectedCompletion
// history (already date-stamped, no new state needed), not a new schedule
// of its own. Gigs reuse this same grid (amber instead of teal) since a gig
// is also a per-day thing, same as a Daily item — only Weekly items get a
// different treatment (see WeeklyStopSection below), since "any one day
// this week" doesn't fit a day-by-day grid the way "every day" does.
function DailyGridSection({
  emptyLabel,
  items,
  weekDates,
  todayStr,
  isDoneOn,
  isTappableOn,
  onPressCell,
  color,
  ringColor,
}: {
  emptyLabel: string;
  items: { id: string; name: string }[];
  weekDates: string[];
  todayStr: string;
  isDoneOn: (itemId: string, date: string) => boolean;
  isTappableOn: (itemId: string, date: string) => boolean;
  onPressCell: (itemId: string) => void;
  color: string;
  ringColor: string;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.gridSection}>
        <Text style={styles.emptyTabText}>{emptyLabel}</Text>
      </View>
    );
  }
  return (
    <View style={styles.gridSection}>
      <View style={styles.gridHeaderRow}>
        <View style={styles.gridLabelCol} />
        {weekDates.map((d, i) => (
          <View key={d} style={styles.gridHeaderCell}>
            <Text style={[styles.gridHeaderDay, d === todayStr && { color }]}>{WEEKDAY_ABBR[i]}</Text>
          </View>
        ))}
      </View>
      {items.map((item) => (
        <View key={item.id} style={styles.gridRow}>
          <View style={styles.gridLabelCol}>
            <View style={styles.gridLabelIcon}>
              <TaskIcon name={guessTaskIcon(item.name)} size={15} color="#B3AA96" />
            </View>
            <Text style={styles.gridLabelText} numberOfLines={2}>{item.name}</Text>
          </View>
          {weekDates.map((d) => {
            const isDone = isDoneOn(item.id, d);
            const isToday = d === todayStr;
            const isFuture = d > todayStr;
            const tappable = isTappableOn(item.id, d);
            return (
              <Pressable key={d} disabled={!tappable} onPress={() => onPressCell(item.id)} style={styles.gridCell}>
                <View
                  style={[
                    styles.gridDot,
                    { borderColor: ringColor },
                    isDone && { backgroundColor: color, borderColor: color },
                    isToday && !isDone && { borderColor: color },
                    isFuture && !isDone && styles.gridDotFuture,
                  ]}
                >
                  {isDone && <Text style={styles.gridCheck}>{'✓'}</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const STOP_WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Weekly items' own block — a big circular stop (same visual language as
// the Today Trail's stops) plus a status caption, instead of the day grid
// above. A weekly item only ever needs ONE completion, on any day, so a row
// of seven mostly-empty rings read as if six days were still outstanding —
// this instead states the fact in words ("Done Thursday" / "Anytime this
// week"), same as the Trail already does for a single thing to do.
function WeeklyStopSection({
  items,
  weekDates,
  todayStr,
  expectedCompletions,
  isExpectedDoneToday,
  onPressStop,
}: {
  items: ExpectedItem[];
  weekDates: string[];
  todayStr: string;
  expectedCompletions: ExpectedCompletion[];
  isExpectedDoneToday: (id: string) => boolean;
  onPressStop: (itemId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.gridSection}>
        <Text style={styles.emptyTabText}>No weekly items yet — add some in Settings.</Text>
      </View>
    );
  }
  return (
    <View style={styles.gridSection}>
      {items.map((item) => {
        const completion = weekDates
          .map((d) => expectedCompletions.find((c) => c.expectedItemId === item.id && c.date === d))
          .find(Boolean);
        const done = !!completion;
        const tappable = !done && !isExpectedDoneToday(item.id);
        const doneDayName = completion ? STOP_WEEKDAY_NAMES[new Date(`${completion.date}T00:00:00`).getDay()] : null;
        return (
          <Pressable
            key={item.id}
            disabled={!tappable}
            onPress={() => onPressStop(item.id)}
            style={styles.stopRow}
          >
            <View style={[styles.stopCircle, done && styles.stopCircleDone]}>
              <TaskIcon name={guessTaskIcon(item.name)} size={16} color={done ? '#FFFFFF' : '#B3AA96'} />
            </View>
            <View style={styles.stopBody}>
              <Text style={styles.stopName}>{item.name}</Text>
              <Text style={[styles.stopStatus, done && styles.stopStatusDone]}>
                {done ? `Done ${doneDayName}` : 'Anytime this week · tap to do today'}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// Two one-time, local-only (not synced — seeing either again on a second
// device is harmless) coachmarks about Settings, shown one at a time in
// order — a parent who never opens Settings on their own still discovers
// what lives there. Sits in normal flow between the header and the goal
// card (not floating/absolutely positioned) — an earlier floating version
// aimed to hover over the goal card's corner but, at real device widths,
// ended up covering the profile chip it was supposed to point at. Normal
// flow guarantees it can never overlap the chip above it, at the cost of
// nudging the goal card down slightly while a hint is showing.
// A right-chevron advances tip 1 to tip 2 (like a "Next" step in an
// onboarding carousel); only the final tip shows an "×", since that's the
// one that actually closes the sequence for good. Tapping the card itself
// (not the chevron/×) still jumps straight to Settings.
// Versioned (v3): AsyncStorage is device-local, not account-scoped, so
// dismissing these while reviewing an earlier design marked them seen for
// every profile on that device, including a brand-new one. Bumping the
// keys invalidates stale "seen" state whenever the design changes enough
// that people should see it again.
const SETTINGS_HINT_SEEN_KEY = 'merit.settingsHintSeen.v3';
const MONEY_HINT_SEEN_KEY = 'merit.moneySettingsHintSeen.v3';

type HintStage = 'none' | 'settings' | 'money';

const HINT_COPY: Record<Exclude<HintStage, 'none'>, string> = {
  settings: 'Tap the profile chip anytime to edit gigs, chores, or values.',
  money: 'Gig dollar values and Future Fund % are automatically set — go to Settings to edit these any time.',
};

function SettingsHintBadge({ onNavigateToSettings }: { onNavigateToSettings: () => void }) {
  const [hintStage, setHintStage] = useState<HintStage>('none');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [settingsSeen, moneySeen] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_HINT_SEEN_KEY),
        AsyncStorage.getItem(MONEY_HINT_SEEN_KEY),
      ]);
      if (cancelled) return;
      if (!settingsSeen) setHintStage('settings');
      else if (!moneySeen) setHintStage('money');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    if (hintStage === 'settings') {
      AsyncStorage.setItem(SETTINGS_HINT_SEEN_KEY, '1').catch(() => {});
      AsyncStorage.getItem(MONEY_HINT_SEEN_KEY).then((moneySeen) => {
        setHintStage(moneySeen ? 'none' : 'money');
      });
    } else if (hintStage === 'money') {
      AsyncStorage.setItem(MONEY_HINT_SEEN_KEY, '1').catch(() => {});
      setHintStage('none');
    }
  };

  if (hintStage === 'none') return null;
  const stepNumber = hintStage === 'settings' ? 1 : 2;
  const isLastStep = hintStage === 'money';

  return (
    <View style={styles.hintRow}>
      <View style={styles.hintArrow} />
      <Pressable
        style={styles.hintBadge}
        onPress={() => {
          dismiss();
          onNavigateToSettings();
        }}
      >
        <Pressable onPress={dismiss} hitSlop={8} style={styles.hintControl}>
          <Text style={styles.hintControlText}>{isLastStep ? '×' : '›'}</Text>
        </Pressable>
        <Text style={styles.hintCount}>TIP {stepNumber} OF 2</Text>
        <Text style={styles.hintText}>{HINT_COPY[hintStage]}</Text>
      </Pressable>
    </View>
  );
}

export function ChildHomeScreen() {
  const navigation = useNavigation<ChildHomeNavigationProp>();
  const {
    childProfile,
    expectedItems,
    expectedCompletions,
    isExpectedDoneToday,
    markExpectedDone,
    allExpectedDoneToday,
    expectedDoneCountToday,
    activeGoal,
    goalProgressPercentage,
    gigs,
    gigCompletions,
    gigPreviewPercentage,
    gigCompletionStatusToday,
    markGigDone,
    soundEnabled,
    expectedStreak,
    scheduleEvents,
  } = useAppData();

  const [view, setView] = useState<'today' | 'week'>('today');
  // "This Week" sub-tabs — Daily/Gigs/Weekly used to stack as three
  // sections on one screen, which ran very long for a household with a lot
  // of gigs (a 9-gig household hits 9 full grid rows before Weekly even
  // starts). One category visible at a time keeps the screen a flat,
  // predictable length no matter how many items get added later.
  const [weekSubTab, setWeekSubTab] = useState<'daily' | 'gigs' | 'weekly'>('daily');

  const [focusedAt, setFocusedAt] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setFocusedAt(Date.now());
    }, [])
  );
  const todaysEvents = useMemo(() => scheduleEventsForToday(scheduleEvents), [scheduleEvents, focusedAt]);
  const todayLabel = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'long' }), [focusedAt]);
  const todayStr = useMemo(() => todayString(), [focusedAt]);
  const weekDates = useMemo(() => {
    const start = startOfWeek(todayStr);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [todayStr]);

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
  // The colored (done) portion of the path is teal through the Expected
  // stops, then switches to the Gigs amber once progress actually reaches
  // the gig stops — two Path elements sharing the junction point (the last
  // Expected point) so the color change reads as a continuous line, not a
  // gap.
  const expectedCount = dailyItems.length;
  const expectedProgress = Math.min(shownProgress, expectedCount);
  const gigJunction = Math.max(expectedCount - 1, 0);
  const showGigProgress = shownProgress > expectedCount && stops.length > expectedCount;
  const avatarIdx = Math.min(doneCount, Math.max(points.length - 1, 0));
  const avatarPoint = points[avatarIdx] ?? trailPointAt(0);
  const trailHeight = points.length > 0 ? FIRST_Y + (points.length - 1) * STEP_Y + 70 : 0;
  const gigsDoneToday = gigs.some((gig) => gigCompletionStatusToday(gig.id) === 'approved');
  const gigsDoneCount = gigs.filter((gig) => gigCompletionStatusToday(gig.id) === 'approved').length;
  // isExpectedDoneToday, for a weekly item, already means "satisfied
  // somewhere this week" (see isExpectedItemSatisfied) — reused here for
  // the Weekly sub-tab's count badge.
  const weeklyDoneCount = weeklyItems.filter((item) => isExpectedDoneToday(item.id)).length;

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

  // "This Week" grid helpers — a gig is per-day, same as a Daily Expected
  // item, so both share DailyGridSection's day-by-day rendering.
  const dailyIsDoneOn = (itemId: string, date: string) =>
    expectedCompletions.some((c) => c.expectedItemId === itemId && c.date === date);
  const dailyIsTappableOn = (itemId: string, date: string) => date === todayStr && !dailyIsDoneOn(itemId, date);
  const gigIsDoneOn = (gigId: string, date: string) =>
    gigCompletions.some((c) => c.gigId === gigId && c.status === 'approved' && c.markedDoneAt.slice(0, 10) === date);
  const gigIsTappableOn = (gigId: string, date: string) => date === todayStr && gigCompletionStatusToday(gigId) === null;
  const handleGigPressById = (gigId: string) => {
    const gig = gigs.find((g) => g.id === gigId);
    if (gig) handleGigPress(gig);
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

        <SettingsHintBadge onNavigateToSettings={() => navigation.navigate('Settings')} />

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
            {expectedItems.length > 0 && (
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

        {view === 'today' && (
          <View style={styles.doneStatsRow}>
            <Text style={[styles.doneStatText, { color: colors.expected }]}>{done} of {total} Expected</Text>
            <Text style={[styles.doneStatText, { color: colors.gigs }]}>{gigsDoneCount} of {gigs.length} Gigs</Text>
          </View>
        )}

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
                d={pathThrough(points.slice(0, expectedProgress))}
                stroke={colors.expected}
                strokeWidth={7}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {showGigProgress && (
                <Path
                  d={pathThrough(points.slice(gigJunction, shownProgress))}
                  stroke={colors.gigs}
                  strokeWidth={7}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
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

        {view === 'week' && (
          <View style={styles.weeklyPanel}>
            <View style={styles.weekSubTabRow}>
              <Pressable
                onPress={() => setWeekSubTab('daily')}
                style={[styles.weekSubTab, weekSubTab === 'daily' && { backgroundColor: colors.expected }]}
              >
                <Text style={[styles.weekSubTabText, weekSubTab === 'daily' && styles.weekSubTabTextActive]}>Daily</Text>
                <Text style={[styles.weekSubTabCount, weekSubTab === 'daily' && styles.weekSubTabTextActive]}>
                  {done}/{total}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setWeekSubTab('gigs')}
                style={[styles.weekSubTab, weekSubTab === 'gigs' && { backgroundColor: colors.gigs }]}
              >
                <Text style={[styles.weekSubTabText, weekSubTab === 'gigs' && styles.weekSubTabTextActive]}>Gigs</Text>
                <Text style={[styles.weekSubTabCount, weekSubTab === 'gigs' && styles.weekSubTabTextActive]}>
                  {gigsDoneCount}/{gigs.length}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setWeekSubTab('weekly')}
                style={[styles.weekSubTab, weekSubTab === 'weekly' && { backgroundColor: colors.expected }]}
              >
                <Text style={[styles.weekSubTabText, weekSubTab === 'weekly' && styles.weekSubTabTextActive]}>Weekly</Text>
                <Text style={[styles.weekSubTabCount, weekSubTab === 'weekly' && styles.weekSubTabTextActive]}>
                  {weeklyDoneCount}/{weeklyItems.length}
                </Text>
              </Pressable>
            </View>

            {weekSubTab === 'daily' && (
              <DailyGridSection
                emptyLabel="No daily Expected items yet — add some in Settings."
                items={dailyItems}
                weekDates={weekDates}
                todayStr={todayStr}
                isDoneOn={dailyIsDoneOn}
                isTappableOn={dailyIsTappableOn}
                onPressCell={handleExpectedPress}
                color={colors.expected}
                ringColor="#B7D9D3"
              />
            )}
            {weekSubTab === 'gigs' && (
              <DailyGridSection
                emptyLabel="No gigs yet — add some in Settings."
                items={gigs}
                weekDates={weekDates}
                todayStr={todayStr}
                isDoneOn={gigIsDoneOn}
                isTappableOn={gigIsTappableOn}
                onPressCell={handleGigPressById}
                color={colors.gigs}
                ringColor="#E9CB9A"
              />
            )}
            {weekSubTab === 'weekly' && (
              <WeeklyStopSection
                items={weeklyItems}
                weekDates={weekDates}
                todayStr={todayStr}
                expectedCompletions={expectedCompletions}
                isExpectedDoneToday={isExpectedDoneToday}
                onPressStop={handleExpectedPress}
              />
            )}
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
  // Normal flow, not absolutely positioned — sits between the header and
  // the goal card, guaranteed to never overlap the profile chip above it
  // (a floating version aimed at the goal card's corner ended up covering
  // the chip at real device widths). Right-aligned so it still sits
  // roughly under the chip it's pointing at.
  hintRow: { paddingHorizontal: 20, alignItems: 'flex-end', marginBottom: 10 },
  hintArrow: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: colors.futureFund,
    transform: [{ rotate: '45deg' }],
    marginBottom: -6,
    marginRight: 26,
  },
  hintBadge: {
    maxWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.futureFund,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  hintControl: { position: 'absolute', top: 4, right: 8, zIndex: 1, padding: 4 },
  hintControlText: { fontSize: 17, color: colors.futureFund, fontWeight: '800' },
  hintCount: { fontSize: 9, fontWeight: '800', color: colors.futureFund, letterSpacing: 0.4, marginBottom: 3 },
  hintText: { fontSize: 12, lineHeight: 16.5, color: '#5c574b', paddingRight: 14 },
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
  doneStatsRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingHorizontal: 20, marginBottom: 8 },
  doneStatText: { fontSize: 13, fontWeight: '700' },
  weeklyPanel: { paddingHorizontal: 20, paddingTop: 4 },
  weekSubTabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  weekSubTab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    backgroundColor: '#F3EEE2',
  },
  weekSubTabText: { fontSize: 12.5, fontWeight: '800', color: '#8a8578' },
  weekSubTabCount: { fontSize: 10.5, fontWeight: '600', color: '#8a8578', marginTop: 1, opacity: 0.85 },
  weekSubTabTextActive: { color: '#FFFFFF' },
  emptyTabText: { fontSize: 13, color: '#8a8578', textAlign: 'center', paddingVertical: 20, lineHeight: 19 },
  gridSection: { marginBottom: 24 },
  gridHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gridLabelCol: { width: 128, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  gridLabelIcon: { marginTop: 1 },
  gridHeaderCell: { flex: 1, alignItems: 'center' },
  gridHeaderDay: { fontSize: 11, fontWeight: '700', color: '#B3AA96' },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#F0E9D8',
  },
  gridLabelText: { flex: 1, fontSize: 11, fontWeight: '700', color: '#5c574b', lineHeight: 13 },
  gridCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#B7D9D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridDotFuture: { borderColor: '#EDE7D8' },
  gridCheck: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F0E9D8' },
  stopCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#B7D9D3',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopCircleDone: { backgroundColor: colors.expected, borderColor: colors.expected },
  stopBody: { flex: 1 },
  stopName: { fontSize: 13, fontWeight: '800', color: '#1C1E21' },
  stopStatus: { fontSize: 11.5, color: '#8a8578', marginTop: 1 },
  stopStatusDone: { color: colors.expected, fontWeight: '700' },
});
