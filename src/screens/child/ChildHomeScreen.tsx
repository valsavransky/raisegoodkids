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
import { View, Text, Pressable, ScrollView, Alert, Modal, StyleSheet, Image, Animated, LayoutAnimation } from 'react-native';
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
import { FamilyOverview } from '../../components/FamilyOverview';
import { HistoryIcon } from '../../components/HistoryIcon';
import { ExcuseTodaySheet } from '../../components/ExcuseTodaySheet';
import { AvatarGlyph } from '../../components/AvatarGlyph';
import { TaskIcon } from '../../components/icons/TaskIcons';
import { guessTaskIcon } from '../../data/taskIcons';
import { scheduleEventsForToday, formatEventTimeRange, TodayScheduleEvent } from '../../data/schedule';
import { playSound } from '../../services/sound';
import { track } from '../../services/analytics';
import { colors } from '../../theme/colors';
import { todayString, startOfWeek, addDays, localDateOf, formatShortDate } from '../../utils/date';
import { SETTINGS_HINT_SEEN_KEY, MONEY_HINT_SEEN_KEY } from '../../utils/settingsHints';

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
const TAP_HINT = 'Tap an activity to mark it complete. Tap again to undo.';
const TRAIL_WIDTH = 350;
const COLUMN_X: [number, number] = [66, 284];
const STEP_Y = 78;
// Tall enough that the avatar — which floats above the first point by
// AVATAR_SIZE + 26 (see avatarWrap's marginTop) — stays fully inside the
// trail area instead of overlapping the label/toggle row above it.
const FIRST_Y = 100;
const AVATAR_SIZE = 72;
// The avatar floats above the current stop, so the trail reserves that
// headroom above the first stop. Once the avatar has moved on, the headroom is
// just empty space, so the trail slides up by this much (see compactTop).
const HEADROOM_TRIM = 55;
const STOP_SIZE = 50;

type TrailStop =
  | { kind: 'expected'; id: string; name: string; done: boolean; excused: boolean }
  | { kind: 'gig'; id: string; name: string; percentage: number | null; done: boolean; sibling: string | null };

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
  onPressCell: (itemId: string, date: string) => void;
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
        {weekDates.map((d) => (
          <View key={d} style={styles.gridHeaderCell}>
            <Text style={[styles.gridHeaderDay, d === todayStr && { color }]}>{WEEKDAY_ABBR[new Date(`${d}T00:00:00`).getDay()]}</Text>
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
              <Pressable key={d} disabled={!tappable} onPress={() => onPressCell(item.id, d)} style={styles.gridCell}>
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
        const doneDayName = completion ? STOP_WEEKDAY_NAMES[new Date(`${completion.date}T00:00:00`).getDay()] : null;
        return (
          <Pressable
            key={item.id}
            onPress={() => onPressStop(item.id)}
            style={styles.stopRow}
          >
            <View style={[styles.stopCircle, done && styles.stopCircleDone]}>
              <TaskIcon name={guessTaskIcon(item.name)} size={16} color={done ? '#FFFFFF' : '#B3AA96'} />
            </View>
            <View style={styles.stopBody}>
              <Text style={styles.stopName}>{item.name}</Text>
              <Text style={[styles.stopStatus, done && styles.stopStatusDone]}>
                {done ? `Done ${doneDayName}` : 'This week · tap to do'}
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
// card, not floating/absolutely positioned — floating versions were tried
// twice (hovering over the goal card's top-right corner, then nudged down
// a bit) and each time ended up covering either the profile chip above or
// the goal card/toggle row below, since the right offset can only really
// be judged on an actual device after the fact. Normal flow can't overlap
// anything by construction, at the cost of nudging the goal card down
// slightly while a hint is showing. Its horizontal padding matches
// AppHeader's own header row exactly, so the badge's right edge lines up
// with the profile chip's right edge on any device width, without needing
// either one's actual on-screen position.
// A right-chevron advances tip 1 to tip 2 (like a "Next" step in an
// onboarding carousel); only the final tip shows an "×", since that's the
// one that actually closes the sequence for good. Tapping the card itself
// (not the chevron/×) still jumps straight to Settings.
// Key constants (and why they're versioned) live in utils/settingsHints —
// shared with AppDataContext.resetAllData, which now also clears them, so
// a reset gives the hints a truly fresh start too, not just the app data.

type HintStage = 'none' | 'settings' | 'money';

const HINT_COPY: Record<Exclude<HintStage, 'none'>, string> = {
  settings: 'Tap the profile chip anytime to edit Expected activities, gigs, or values.',
  money: 'Gigs start at $2 / $5 / $10 and Future Fund is off. Change either anytime in Settings.',
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
    expectedRequiredCountToday,
    isDayExcused,
    isItemExcusedToday,
    birthdayCelebrationDue,
    activeGoal,
    goalProgressPercentage,
    gigs,
    gigCompletions,
    gigPreviewPercentage,
    gigCompletionStatusToday,
    householdExpectedCompletions,
    householdGigCompletions,
    siblingGigDoneToday,
    viewingEveryone,
    childProfiles,
    markGigDone,
    unmarkExpectedDone,
    unmarkGigDone,
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

  const [excuseSheetVisible, setExcuseSheetVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTop, setMenuTop] = useState(160);
  const moreRef = useRef<View>(null);
  const openMenu = () => {
    // Place the menu just under the ⋯ button.
    moreRef.current?.measureInWindow((_x, y, _w, h) => {
      setMenuTop(y + h + 4);
      setMenuVisible(true);
    });
  };

  const [focusedAt, setFocusedAt] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setFocusedAt(Date.now());
    }, [])
  );
  // On the child's birthday, the first time Today is opened that day, show the
  // celebration (it marks itself as shown, so this only ever fires once).
  useEffect(() => {
    if (birthdayCelebrationDue() !== null) navigation.navigate('BirthdayCelebration');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedAt, childProfile?.birthday]);
  const todaysEvents = useMemo(() => scheduleEventsForToday(scheduleEvents), [scheduleEvents, focusedAt]);
  const todayStr = useMemo(() => todayString(), [focusedAt]);
  // Calendar week (Sun–Sat) — what a weekly item counts against.
  const weekDates = useMemo(() => {
    const start = startOfWeek(todayStr);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [todayStr]);
  // The grid shows the last 7 days ending today, so a forgotten day from just
  // before the weekend is still there on a Monday to be filled in.
  const recentDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(todayStr, i - 6)), [todayStr]);

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
  const required = expectedRequiredCountToday();
  const todayExcused = isDayExcused();
  // The how-to hint is only for a family that hasn't checked anything off yet.
  const hasCheckedOffAnything = householdExpectedCompletions.length > 0 || householdGigCompletions.length > 0;
  const gigsUnlocked = allExpectedDoneToday();
  const streak = expectedStreak();
  const dailyItems = expectedItems.filter((item) => item.frequency === 'daily');
  const weeklyItems = expectedItems.filter((item) => item.frequency === 'weekly');

  const stops: TrailStop[] = [
    ...dailyItems.map((item): TrailStop => ({
      kind: 'expected',
      id: item.id,
      name: item.name,
      done: isExpectedDoneToday(item.id),
      excused: isItemExcusedToday(item.id),
    })),
    ...gigs.map((gig): TrailStop => ({
      kind: 'gig',
      id: gig.id,
      name: gig.name,
      percentage: gigPreviewPercentage(gig),
      done: gigCompletionStatusToday(gig.id) === 'approved',
      sibling: siblingGigDoneToday(gig),
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
  // The avatar marks the next thing to do: the first stop that isn't done, in
  // trail order. So it stays with the Expected activities until they're all
  // done (even if a gig or a later activity was checked off first), then moves
  // on to the gigs, and rests on the last stop once everything is done. On an
  // excused day it skips past excused activities.
  const nextAskedIdx = stops.findIndex((s) => !s.done && !(s.kind === 'expected' && s.excused));
  const avatarIdx = nextAskedIdx >= 0 ? nextAskedIdx : Math.max(points.length - 1, 0);
  const avatarPoint = points[avatarIdx] ?? trailPointAt(0);
  const trailHeight = points.length > 0 ? points[points.length - 1].y + 70 : 0;
  const gigsDoneToday = gigs.some((gig) => gigCompletionStatusToday(gig.id) === 'approved');
  const gigsDoneCount = gigs.filter((gig) => gigCompletionStatusToday(gig.id) === 'approved').length;
  // isExpectedDoneToday, for a weekly item, already means "satisfied
  // somewhere this week" (see isExpectedItemSatisfied) — reused here for
  // the Weekly sub-tab's count badge.
  const weeklyDoneCount = weeklyItems.filter((item) => isExpectedDoneToday(item.id)).length;

  const goalPercent = goal ? Math.min(goalProgressPercentage(goal.id), 100) : 0;

  // Keep the avatar (which marks the next thing to do) on screen: a long
  // trail can leave it below the fold, which reads as "nothing's happening".
  // Scrolls on landing (no animation), when the avatar moves, and when
  // switching back to Today, but only if it isn't already comfortably visible.
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [trailTop, setTrailTop] = useState<number | null>(null);
  const hasAutoScrolled = useRef(false);
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    if (view !== 'today' || trailTop === null || viewportHeight === 0 || stops.length === 0) return;
    const avatarTop = trailTop + avatarPoint.y - AVATAR_SIZE - 26;
    const avatarBottom = trailTop + avatarPoint.y + 70; // through the stop and its label
    const visibleTop = scrollY.current;
    const visibleBottom = scrollY.current + viewportHeight;
    if (avatarTop >= visibleTop && avatarBottom <= visibleBottom) {
      hasAutoScrolled.current = true;
      return;
    }
    scrollRef.current?.scrollTo({ y: Math.max(0, avatarTop - 24), animated: hasAutoScrolled.current });
    hasAutoScrolled.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, trailTop, viewportHeight, avatarPoint.x, avatarPoint.y, stops.length, focusTick]);
  // Coming back to this tab: re-check (the effect above only reruns on change).
  useFocusEffect(
    useCallback(() => {
      hasAutoScrolled.current = false;
      setFocusTick((n) => n + 1);
    }, [])
  );

  // Only the first stop needs headroom for the avatar; after that, trim it.
  const compactTop = stops.length > 0 && avatarIdx > 0;
  const wasCompact = useRef(compactTop);
  useEffect(() => {
    if (wasCompact.current !== compactTop) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      wasCompact.current = compactTop;
    }
  }, [compactTop]);

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

  // A short in-flow confirmation under the toggle after each check-off (it
  // swaps places with the "tap to mark complete" hint, then goes away).
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showMessage = (text: string) => {
    setConfirmation(text);
    if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    confirmationTimer.current = setTimeout(() => setConfirmation(null), 2800);
  };
  const showConfirmation = (itemName: string) => {
    const who = childProfile?.name?.trim().split(/\s+/)[0] || 'They';
    showMessage(`${who} completed "${itemName}"`);
  };
  useEffect(
    () => () => {
      if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    },
    []
  );

  const confirmUnselect = (itemName: string, onConfirm: () => void) => {
    Alert.alert(`Unselect "${itemName}"?`, 'Are you sure? It will go back to not done.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unselect', style: 'destructive', onPress: onConfirm },
    ]);
  };

  // Forgotten earlier days (up to the last week) can be filled in or undone
  // from the This Week grid, each behind an "are you sure".
  const dayLabel = (date: string) =>
    `${STOP_WEEKDAY_NAMES[new Date(`${date}T00:00:00`).getDay()]}, ${formatShortDate(date)}`;
  const confirmPastChange = (itemName: string, date: string, isDone: boolean, onConfirm: () => void) => {
    Alert.alert(
      isDone ? `Unselect "${itemName}"?` : `Mark "${itemName}" done?`,
      isDone
        ? `Are you sure? It will go back to not done for ${dayLabel(date)}.`
        : `Are you sure? This marks it done for ${dayLabel(date)}, not today.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: isDone ? 'Unselect' : 'Yes, mark done', style: isDone ? 'destructive' : 'default', onPress: onConfirm },
      ]
    );
  };

  const handleExpectedPress = (itemId: string, date?: string) => {
    if (date && date !== todayStr) {
      const item = expectedItems.find((i) => i.id === itemId);
      if (!item) return;
      const isDone = dailyIsDoneOn(itemId, date);
      confirmPastChange(item.name, date, isDone, () => {
        if (isDone) {
          unmarkExpectedDone(itemId, date);
          return;
        }
        celebrateCheckoff();
        const { newBadgeCatalogId, completedPastDay } = markExpectedDone(itemId, date);
        if (completedPastDay) {
          const dayName = STOP_WEEKDAY_NAMES[new Date(`${date}T00:00:00`).getDay()];
          showMessage(
            completedPastDay.streak >= 2
              ? `${dayName} is complete! 🔥 ${completedPastDay.streak}-day streak`
              : `${dayName} is complete!`
          );
        }
        if (newBadgeCatalogId) navigation.navigate('BadgeUnlock', { catalogId: newBadgeCatalogId });
      });
      return;
    }
    if (isExpectedDoneToday(itemId)) {
      const done = expectedItems.find((i) => i.id === itemId);
      if (done) confirmUnselect(done.name, () => unmarkExpectedDone(itemId));
      return;
    }
    const tapped = expectedItems.find((i) => i.id === itemId);
    if (tapped) showConfirmation(tapped.name);
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

  const handleGigPress = (gig: Gig, date?: string) => {
    if (date && date !== todayStr) {
      const isDone = gigIsDoneOn(gig.id, date);
      if (!isDone && !goal) {
        Alert.alert('Pick a goal first!', 'Gigs add progress toward a goal. Pick one to get started.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Pick a goal', onPress: () => navigation.navigate('Goal') },
        ]);
        return;
      }
      confirmPastChange(gig.name, date, isDone, () => {
        if (isDone) {
          if (unmarkGigDone(gig.id, date) === 'goal_reached') {
            Alert.alert("Can't unselect this one", 'This gig finished the goal, so it can no longer be undone.');
          }
          return;
        }
        const activeGoalId = goal?.id;
        const { achievedGoal, newBadgeCatalogId } = markGigDone(gig.id, date);
        if (achievedGoal && activeGoalId) {
          navigation.navigate('GoalAchieved', { goalId: activeGoalId });
        } else if (newBadgeCatalogId) {
          navigation.navigate('BadgeUnlock', { catalogId: newBadgeCatalogId });
        }
      });
      return;
    }
    if (gigCompletionStatusToday(gig.id) !== null) {
      confirmUnselect(gig.name, () => {
        if (unmarkGigDone(gig.id) === 'goal_reached') {
          Alert.alert("Can't unselect this one", 'This gig finished the goal, so it can no longer be undone.');
        }
      });
      return;
    }
    if (!goal) {
      Alert.alert('Pick a goal first!', 'Gigs add progress toward a goal. Pick one to get started.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Pick a goal', onPress: () => navigation.navigate('Goal') },
      ]);
      return;
    }
    const activeGoalId = goal.id;
    const startGig = () => {
      showConfirmation(gig.name);
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
      `${childProfile?.name ?? 'Your child'} still has ${required.total - required.done} Expected activit${
        required.total - required.done === 1 ? 'y' : 'ies'
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
  const inEditWindow = (date: string) => date <= todayStr && date >= recentDates[0];
  const dailyIsTappableOn = (_itemId: string, date: string) => inEditWindow(date);
  const gigIsDoneOn = (gigId: string, date: string) =>
    gigCompletions.some((c) => c.gigId === gigId && c.status === 'approved' && localDateOf(c.markedDoneAt) === date);
  const gigIsTappableOn = (_gigId: string, date: string) => inEditWindow(date);
  const handleGigPressById = (gigId: string, date: string) => {
    const gig = gigs.find((g) => g.id === gigId);
    if (gig) handleGigPress(gig, date);
  };

  if (viewingEveryone && childProfiles.length > 1) {
    return (
      <View style={styles.screen}>
        <AppHeader />
        <FamilyOverview />
      </View>
    );
  }

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
              {goal.photoUri && <Image source={{ uri: goal.photoUri }} style={styles.goalPhoto} />}
              <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${goalPercent}%` }]} />
              </View>
              <Text style={styles.goalProgressText}>{goalPercent}%</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
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
                onPress={() => {
                  setView('week');
                  track('week_view_opened');
                }}
                style={[styles.toggleTab, view === 'week' && styles.toggleTabActive]}
              >
                <Text style={[styles.toggleTabText, view === 'week' && styles.toggleTabTextActive]}>This Week</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.streakRow}>
            {view === 'today' && streak > 0 && (
              <Text style={styles.streakText} accessibilityLabel={`${streak}-day streak`}>
                🔥 {streak}
              </Text>
            )}
            <Pressable
              ref={moreRef}
              onPress={openMenu}
              hitSlop={10}
              accessibilityLabel="More options"
              style={styles.moreButton}
            >
              <Text style={styles.moreButtonText}>⋯</Text>
            </Pressable>
          </View>
        </View>

        {view === 'today' && !childProfile?.birthday && childProfile && (
          <Pressable style={styles.birthdayCard} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.birthdayCardText}>
              🎂 Add {childProfile.name.trim().split(/\s+/)[0]}'s birthday for a birthday celebration
            </Text>
            <Text style={styles.birthdayCardChevron}>{'›'}</Text>
          </Pressable>
        )}

        {view === 'today' && todayExcused && (
          <View style={styles.excusedNote}>
            <Text style={styles.excusedNoteText}>🌴 Day off from Expected Activities today</Text>
          </View>
        )}

        {view === 'today' && stops.length > 0 &&
          (confirmation ? (
            <View style={styles.confirmBanner}>
              <Text style={styles.confirmBannerText}>✓ {confirmation}</Text>
            </View>
          ) : (
            // Only until anything has been checked off; "How Today works" in the ⋯ menu brings it back.
            !hasCheckedOffAnything && <Text style={styles.tapHint}>{TAP_HINT}</Text>
          ))}

        {view === 'today' && todaysEvents.length > 0 && (
          <View style={styles.scheduleStrip}>
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

        {view === 'today' && stops.length === 0 && (
          <View style={styles.emptyToday}>
            <Text style={styles.emptyTodayIcon}>🌱</Text>
            <Text style={styles.emptyTodayTitle}>Nothing to do yet!</Text>
            <Text style={styles.emptyTodayNote}>Grown-up: add Expected activities and gigs in Settings.</Text>
          </View>
        )}

        {view === 'today' && stops.length > 0 && (
          <View
            style={[styles.trailArea, { height: trailHeight }, compactTop && { marginTop: 10 - HEADROOM_TRIM }]}
            onLayout={(e) => setTrailTop(e.nativeEvent.layout.y)}
          >
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
                  <View style={[styles.stopLabelWrap, { left: point.x - 62, top: point.y + 32 }]}>
                    <Text style={styles.stopLabel} numberOfLines={2}>{stop.name}</Text>
                    {stop.kind === 'expected' && stop.excused && !stop.done && (
                      <Text style={styles.stopExcused}>Excused</Text>
                    )}
                    {stop.kind === 'gig' && stop.percentage !== null && (
                      <Text style={styles.stopAmount}>+{stop.percentage}%</Text>
                    )}
                    {stop.kind === 'gig' && stop.sibling && !stop.done && (
                      <Text style={styles.stopSibling}>Done by {stop.sibling} today</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {view === 'week' && (
          <View style={styles.weeklyPanel}>
            {confirmation ? (
              <View style={[styles.confirmBanner, { marginHorizontal: 0 }]}>
                <Text style={styles.confirmBannerText}>✓ {confirmation}</Text>
              </View>
            ) : (
              weekSubTab !== 'weekly' && (
                <Text style={styles.weekHint}>Forgot to check something off? Tap a day from the past week to fill it in.</Text>
              )
            )}
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
                emptyLabel="No daily Expected activities yet — add some in Settings."
                items={dailyItems}
                weekDates={recentDates}
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
                weekDates={recentDates}
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

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menu, { top: menuTop }]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                track('history_opened');
                navigation.navigate('History');
              }}
            >
              <View style={styles.menuIcon}><HistoryIcon size={18} /></View>
              <Text style={styles.menuItemText}>History</Text>
            </Pressable>
            <Pressable
              style={[styles.menuItem, styles.menuItemDivider]}
              onPress={() => {
                setMenuVisible(false);
                setExcuseSheetVisible(true);
              }}
            >
              <Text style={[styles.menuIcon, styles.menuEmoji]}>🌴</Text>
              <Text style={styles.menuItemText}>Excuse today</Text>
            </Pressable>
            <Pressable
              style={[styles.menuItem, styles.menuItemDivider]}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('How Today works', TAP_HINT);
              }}
            >
              <Text style={[styles.menuIcon, styles.menuEmoji]}>💡</Text>
              <Text style={styles.menuItemText}>How Today works</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ExcuseTodaySheet
        visible={excuseSheetVisible}
        onClose={() => setExcuseSheetVisible(false)}
        onMoreDays={() => navigation.navigate('ExcusedDaysSettings', { openAdd: true })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F0' },
  fixedHeader: { paddingBottom: 12, backgroundColor: '#FFF8F0' },
  goalCardWrapper: { paddingHorizontal: 20 },
  // Back to normal flow — floating (absolutely positioned) versions kept
  // either covering the chip above or overlapping the goal card/toggle row
  // below, since their offsets were hand-guessed against a device this
  // could only be checked on after the fact. Normal flow can't overlap
  // anything by construction. paddingHorizontal here matches AppHeader's
  // own header row padding exactly, so with alignItems:'flex-end' this
  // badge's right edge lines up with the profile chip's right edge on any
  // device width, without needing to know either one's actual position.
  hintRow: { paddingHorizontal: 20, alignItems: 'flex-end', marginBottom: 6 },
  hintArrow: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: colors.futureFund,
    transform: [{ rotate: '45deg' }],
    marginBottom: -6,
    marginRight: 16,
  },
  hintBadge: {
    // Narrowed by roughly a third from the original 260.
    width: 172,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.futureFund,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  // One slim line: photo (if any), name, a short progress bar, and the percent.
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FDF1E2', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 4 },
  goalPhoto: { width: 28, height: 28, borderRadius: 7 },
  goalName: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text },
  progressBarTrack: { width: 72, height: 7, borderRadius: 999, backgroundColor: '#F7DFC0', overflow: 'hidden' },
  progressBarFill: { height: 7, borderRadius: 999, backgroundColor: colors.gigs },
  goalProgressText: { fontSize: 12.5, color: '#B96A08', fontWeight: '800', minWidth: 32, textAlign: 'right' },
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
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moreButton: { paddingHorizontal: 6, paddingBottom: 4 },
  menuBackdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    right: 20,
    width: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16 },
  menuItemDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  menuIcon: { width: 22, alignItems: 'center', justifyContent: 'center' },
  menuEmoji: { fontSize: 17, textAlign: 'center' },
  menuItemText: { fontSize: 15, fontWeight: '600', color: colors.text },
  moreButtonText: { fontSize: 22, fontWeight: '800', color: colors.textMuted, lineHeight: 22 },
  excusedNote: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#E4F4F1',
    borderWidth: 1,
    borderColor: '#BFE4DE',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  excusedNoteText: { fontSize: 12.5, fontWeight: '700', color: '#0B6D63' },
  birthdayCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#FCEBD2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  birthdayCardText: { flex: 1, fontSize: 12.5, fontWeight: '700', color: '#8a5a12' },
  birthdayCardChevron: { fontSize: 18, color: '#8a5a12', fontWeight: '700' },
  stopExcused: { fontWeight: '800', fontSize: 9.5, color: '#0B6D63', marginTop: 1 },
  streakText: { fontSize: 12.5, color: colors.expected, fontWeight: '700' },
  scheduleStrip: { paddingHorizontal: 20, marginBottom: 6 },
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
  weekHint: { fontSize: 12.5, color: '#8a8578', marginBottom: 10 },
  tapHint: { fontSize: 12.5, color: '#8a8578', paddingHorizontal: 20, marginBottom: 8 },
  confirmBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: colors.successBackground,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  confirmBannerText: { fontSize: 13, fontWeight: '700', color: colors.success },
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
  stopLabelWrap: { position: 'absolute', width: 124, alignItems: 'center' },
  stopLabel: { fontWeight: '700', fontSize: 12, color: '#5c574b', textAlign: 'center', lineHeight: 15 },
  stopSibling: { fontWeight: '700', fontSize: 9.5, color: '#7a7568', marginTop: 1 },
  stopAmount: { fontWeight: '800', fontSize: 10, color: '#B96A08', marginTop: 1 },
  emptyToday: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 40, gap: 6 },
  emptyTodayIcon: { fontSize: 40 },
  emptyTodayTitle: { fontSize: 18, fontWeight: '800', color: '#5c574b' },
  emptyTodayNote: { fontSize: 13, color: '#8a8578', textAlign: 'center', lineHeight: 18 },
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
