// Runtime data for the "live" app, as opposed to SetupContext's in-progress
// wizard draft. Seeded once from that draft when setup finishes. Persisted
// to on-device storage (AsyncStorage) as a single JSON blob — no backend,
// no per-child sync, just enough to survive an app restart. The setup
// wizard's own draft (SetupContext) is NOT persisted: losing a half-filled
// wizard on restart is a minor inconvenience, unlike losing days of
// accumulated progress.
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { fetchData, saveData } from '../services/api';
import {
  ChildProfile,
  ScheduleEvent,
  ExpectedItem,
  ExpectedCompletion,
  Gig,
  GigCompletion,
  Goal,
  GoalCategory,
  FutureFund,
  GigEffortValues,
  Badge,
} from '../types/models';
import { DraftChildProfile, DraftScheduleEvent, DraftExpectedItem, DraftGig } from './SetupContext';
import { makeId } from '../utils/id';
import { todayString } from '../utils/date';
import { computeExpectedStreak } from '../utils/streak';
import { isExpectedItemSatisfied } from '../utils/expectedItemStatus';
import { computeGigPercentage, DEFAULT_GIG_EFFORT_VALUES } from '../utils/gigValue';
import { STREAK_THRESHOLDS, GIG_MILESTONE_THRESHOLDS, FUTURE_FUND_THRESHOLDS, getBadgeCatalogEntry } from '../data/badgeCatalog';

const DEFAULT_FUTURE_FUND_PERCENTAGE = 10;
const STORAGE_KEY = '@merit/appData/v1';

interface PersistedAppData {
  parentName: string | null;
  childProfile: ChildProfile | null;
  scheduleEvents: ScheduleEvent[];
  expectedItems: ExpectedItem[];
  expectedCompletions: ExpectedCompletion[];
  gigs: Gig[];
  gigCompletions: GigCompletion[];
  goals: Goal[];
  futureFund: FutureFund | null;
  gigEffortValues: GigEffortValues;
  badges: Badge[];
  /** Defaults to true (missing on any data saved before this field existed,
   * so `?? true` at every read site treats that the same as "on"). */
  soundEnabled: boolean;
}

export interface MarkGigDoneResult {
  achievedGoal: boolean;
  /** A newly-earned badge's catalogId, if any — only ever set when the goal
   * WASN'T also achieved this tap, so the bigger goal-achieved celebration
   * doesn't get upstaged by a badge popup in the same instant. The badge is
   * still recorded either way; it just surfaces on the shelf instead. */
  newBadgeCatalogId: string | null;
  /** True exactly once per day — on the tap that completes the last
   * remaining active gig — so callers can show the "all gigs done"
   * celebration. Same precedence as newBadgeCatalogId: only set when the
   * goal WASN'T also achieved this same tap. */
  allGigsDoneToday: boolean;
}

export interface MarkExpectedDoneResult {
  /** A newly-earned badge's catalogId, if any — either a streak badge
   * (alongside allDoneToday === true) or the weekly-completion badge
   * (alongside allWeeklyDoneThisWeek === true). Never both in the same
   * call, since a single item is either daily or weekly. */
  newBadgeCatalogId: string | null;
  /** True only when the tapped item was itself a daily one and it completed
   * today's full daily set — so a weekly item's checkoff never re-fires the
   * "all done today" celebration just because the daily set happened to
   * already be finished. */
  allDoneToday: boolean;
  /** True only when the tapped item was itself a weekly one and it
   * completed every active weekly item for the current week (Sunday
   * through Saturday) — the weekly counterpart to allDoneToday. */
  allWeeklyDoneThisWeek: boolean;
}

interface AppDataContextValue {
  /** False until persisted data (if any) has been loaded from storage —
   * callers should show a loading state rather than the setup wizard,
   * since a null childProfile before hydration doesn't yet mean "new
   * user," just "haven't checked storage yet." */
  isHydrated: boolean;
  /** The parent's own name — no separate ParentAccount entity exists yet
   * (see ChildProfile.parentAccountId), so this lives as its own top-level
   * field rather than awkwardly on the child's profile. */
  parentName: string | null;
  childProfile: ChildProfile | null;
  scheduleEvents: ScheduleEvent[];
  expectedItems: ExpectedItem[];
  expectedCompletions: ExpectedCompletion[];
  gigs: Gig[];
  gigCompletions: GigCompletion[];
  goals: Goal[];
  futureFund: FutureFund | null;
  gigEffortValues: GigEffortValues;
  badges: Badge[];
  /** Household-wide toggle for the checkoff/badge-unlock sound effects —
   * off by default nowhere, since a kid's first reaction should be
   * delightful, but easy to mute for a quiet room or a shared device. */
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  completeSetup: (draft: {
    childProfile: DraftChildProfile;
    scheduleEvents: DraftScheduleEvent[];
    expectedItems: DraftExpectedItem[];
    gigs: DraftGig[];
  }) => void;

  /** Fixes a real gap: nothing after initial setup could correct a typo'd
   * child name/birthday or edit any other profile field until now. */
  updateChildProfile: (fields: Partial<Omit<ChildProfile, 'id' | 'parentAccountId'>>) => void;
  updateParentName: (name: string) => void;

  isExpectedDoneToday: (expectedItemId: string) => boolean;
  markExpectedDone: (expectedItemId: string) => MarkExpectedDoneResult;
  allExpectedDoneToday: () => boolean;
  expectedDoneCountToday: () => { done: number; total: number };
  expectedStreak: () => number;

  activeGoal: () => Goal | undefined;
  queuedGoals: () => Goal[];
  completedGoals: () => Goal[];
  getGoal: (goalId: string) => Goal | undefined;
  addGoal: (name: string, realWorldCost: number, category?: GoalCategory, photoUri?: string) => void;
  setActiveGoal: (goalId: string) => void;
  /** Only allowed for a non-active goal with zero progress recorded against
   * it — a goal that was ever active could carry real earned progress. */
  canModifyGoal: (goalId: string) => boolean;
  updateGoal: (goalId: string, fields: { name: string; realWorldCost: number; photoUri?: string }) => void;
  deleteGoal: (goalId: string) => void;
  goalProgressPercentage: (goalId: string) => number;
  /** Count of a goal's approved gig completions dated today — lets a caller
   * decide whether "move today's progress" is even worth offering before
   * switching the active goal (see moveTodaysGigProgressToGoal). */
  todaysApprovedGigCount: (goalId: string) => number;
  /** Reassigns a goal's today-dated approved gig completions to a different
   * goal, recomputing each one's percentageAwarded against the destination
   * goal's own cost (the original figure was computed against the source
   * goal's cost — a straight goalId swap without recomputing would
   * misrepresent progress). Deliberately scoped to today only, and never
   * automatic — every ordinary active-goal swap (including the automatic
   * one when a goal is achieved) must leave each goal's own progress alone;
   * this is only for a parent explicitly correcting a same-day "wrong goal
   * was active" mistake. */
  moveTodaysGigProgressToGoal: (fromGoalId: string, toGoalId: string) => void;
  /** Records real-world delivery of an achieved goal. Does NOT gate the next
   * queued goal — that activates automatically the moment this one is
   * achieved (see markGigDone), since a parent might not get to the real-
   * world purchase/trip right away (a future vacation, say) and shouldn't
   * have to before the child can keep earning toward the next thing. */
  markGoalFulfilled: (goalId: string) => void;

  gigPreviewPercentage: (gig: Gig) => number | null;
  gigCompletionStatusToday: (gigId: string) => GigCompletion['status'] | null;
  markGigDone: (gigId: string) => MarkGigDoneResult;

  /** Parent logs having actually moved money from the Future Fund into a
   * real account — reduces the tracked (pending) balance by that amount. */
  recordFutureFundContribution: (amount: number) => void;

  addScheduleEvent: (event: Omit<ScheduleEvent, 'id' | 'childProfileId'>) => void;
  updateScheduleEvent: (id: string, fields: Omit<ScheduleEvent, 'id' | 'childProfileId'>) => void;
  deleteScheduleEvent: (id: string) => void;

  addExpectedItem: (item: { name: string; frequency: ExpectedItem['frequency'] }) => void;
  updateExpectedItem: (id: string, fields: { name: string; frequency: ExpectedItem['frequency'] }) => void;
  deleteExpectedItem: (id: string) => void;

  addGig: (gig: { name: string; effortTier: Gig['effortTier'] }) => void;
  updateGig: (id: string, fields: { name: string; effortTier: Gig['effortTier'] }) => void;
  deleteGig: (id: string) => void;

  /** How much each effort tier is worth in dollars, before the Future Fund
   * skim — parent-configurable in Manage Expected & Gigs. */
  updateGigEffortValues: (values: GigEffortValues) => void;

  /** Clears persisted storage and all in-memory state — a testing
   * convenience now that data survives restarts. */
  resetAllData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { token, isReady: authIsReady } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  // Set once the very first server reconcile (adopt server data on a fresh
  // install, or push local data up otherwise) has run — the ordinary
  // persist-on-change effect below holds off pushing to the server until
  // then, so it can't race the reconcile and stomp real server data with
  // an empty fresh-install blob.
  const [hasReconciled, setHasReconciled] = useState(false);
  // Tracks which token was last reconciled (rather than a plain "has this
  // run" boolean) so logging into a different account later — see
  // AuthContext.login, only ever offered before a local profile exists —
  // triggers a fresh reconcile against the new token instead of being
  // silently skipped.
  const reconciledTokenRef = useRef<string | null>(null);
  const [parentName, setParentName] = useState<string | null>(null);
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [expectedItems, setExpectedItems] = useState<ExpectedItem[]>([]);
  const [expectedCompletions, setExpectedCompletions] = useState<ExpectedCompletion[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [gigCompletions, setGigCompletions] = useState<GigCompletion[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [futureFund, setFutureFund] = useState<FutureFund | null>(null);
  const [gigEffortValues, setGigEffortValues] = useState<GigEffortValues>(DEFAULT_GIG_EFFORT_VALUES);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Load once on mount. Until this resolves, isHydrated stays false so
  // callers don't mistake "haven't checked storage yet" for "new user."
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: PersistedAppData = JSON.parse(raw);
          setParentName(data.parentName ?? null);
          setChildProfile(data.childProfile);
          setScheduleEvents(data.scheduleEvents);
          setExpectedItems(data.expectedItems);
          setExpectedCompletions(data.expectedCompletions);
          setGigs(data.gigs);
          setGigCompletions(data.gigCompletions);
          setGoals(data.goals);
          setFutureFund(data.futureFund);
          setGigEffortValues(data.gigEffortValues ?? DEFAULT_GIG_EFFORT_VALUES);
          setBadges(data.badges);
          setSoundEnabled(data.soundEnabled ?? true);
        }
      } catch (e) {
        console.warn('Failed to load persisted app data', e);
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // Runs once, the first time both local storage has loaded and a server
  // account is available. A fresh install with nothing local yet but real
  // data already on the server (a reinstall, or a second device) adopts
  // the server's copy; otherwise this device's local data is the one to
  // keep, and gets pushed up so the server has a current copy too.
  useEffect(() => {
    if (!isHydrated || !authIsReady || !token || reconciledTokenRef.current === token) return;
    reconciledTokenRef.current = token;
    (async () => {
      try {
        const { data: serverData } = await fetchData(token);
        if (serverData && !childProfile) {
          const data = serverData as PersistedAppData;
          setParentName(data.parentName ?? null);
          setChildProfile(data.childProfile);
          setScheduleEvents(data.scheduleEvents);
          setExpectedItems(data.expectedItems);
          setExpectedCompletions(data.expectedCompletions);
          setGigs(data.gigs);
          setGigCompletions(data.gigCompletions);
          setGoals(data.goals);
          setFutureFund(data.futureFund);
          setGigEffortValues(data.gigEffortValues ?? DEFAULT_GIG_EFFORT_VALUES);
          setBadges(data.badges);
          setSoundEnabled(data.soundEnabled ?? true);
        } else if (childProfile) {
          await saveData(token, {
            parentName,
            childProfile,
            scheduleEvents,
            expectedItems,
            expectedCompletions,
            gigs,
            gigCompletions,
            goals,
            futureFund,
            gigEffortValues,
            badges,
            soundEnabled,
          });
        }
      } catch (e) {
        console.warn('Initial server sync failed, continuing offline', e);
      } finally {
        setHasReconciled(true);
      }
    })();
  }, [isHydrated, authIsReady, token]);

  // Persist on every change, once hydrated. Skipped pre-hydration so the
  // initial empty defaults don't overwrite whatever was just loaded.
  // Also pushes to the server once the initial reconcile (above) has run,
  // so day-to-day changes keep backing up automatically.
  useEffect(() => {
    if (!isHydrated) return;
    const data: PersistedAppData = {
      parentName,
      childProfile,
      scheduleEvents,
      expectedItems,
      expectedCompletions,
      gigs,
      gigCompletions,
      goals,
      futureFund,
      gigEffortValues,
      badges,
      soundEnabled,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((e) =>
      console.warn('Failed to persist app data', e)
    );
    if (token && hasReconciled) {
      saveData(token, data).catch((e) => console.warn('Failed to sync app data to server', e));
    }
  }, [
    isHydrated,
    token,
    hasReconciled,
    parentName,
    childProfile,
    scheduleEvents,
    expectedItems,
    expectedCompletions,
    gigs,
    gigCompletions,
    goals,
    futureFund,
    gigEffortValues,
    badges,
    soundEnabled,
  ]);

  const updateChildProfile: AppDataContextValue['updateChildProfile'] = (fields) => {
    setChildProfile((prev) => (prev ? { ...prev, ...fields } : prev));
  };

  const updateParentName: AppDataContextValue['updateParentName'] = (name) => {
    setParentName(name.trim().length > 0 ? name.trim() : null);
  };

  const completeSetup: AppDataContextValue['completeSetup'] = (draft) => {
    const childId = makeId('child');
    setChildProfile({
      id: childId,
      parentAccountId: 'local-parent',
      name: draft.childProfile.name,
      avatarId: draft.childProfile.avatarId,
      birthday: draft.childProfile.birthday,
      grade: draft.childProfile.grade,
      hasYard: draft.childProfile.hasYard,
      hasCar: draft.childProfile.hasCar,
      hasPet: draft.childProfile.hasPet,
      petType: draft.childProfile.petType,
      petName: draft.childProfile.petName,
    });
    setScheduleEvents(
      draft.scheduleEvents.map((e) => ({
        id: makeId('scheduleEvent'),
        childProfileId: childId,
        title: e.title,
        category: e.category,
        recurring: e.recurring,
        daysOfWeek: e.daysOfWeek,
        cadence: e.cadence,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        source: 'manual',
      }))
    );
    setExpectedItems(
      draft.expectedItems
        .filter((item) => item.active)
        .map((item) => ({
          id: makeId('expectedItem'),
          childProfileId: childId,
          name: item.name,
          frequency: item.frequency,
          active: true,
          linkedEventTitle: item.linkedEventTitle,
        }))
    );
    setGigs(
      draft.gigs
        .filter((gig) => gig.active)
        .map((gig) => ({
          id: makeId('gig'),
          childProfileId: childId,
          name: gig.name,
          effortTier: gig.effortTier,
          active: true,
        }))
    );
    setFutureFund({
      id: makeId('futureFund'),
      childProfileId: childId,
      percentage: DEFAULT_FUTURE_FUND_PERCENTAGE,
      balance: 0,
      // Lowered from the vision doc's $100 example to $50 so the milestone
      // is reachable in testing without needing dozens of gigs.
      milestoneThreshold: 50,
    });
  };

  const isExpectedDoneToday = (expectedItemId: string): boolean => {
    const item = expectedItems.find((i) => i.id === expectedItemId);
    if (!item) return false;
    return isExpectedItemSatisfied(item, expectedCompletions, todayString());
  };

  const hasBadge = (catalogId: string): boolean => badges.some((b) => b.catalogId === catalogId);

  const awardBadge = (
    catalogId: string,
    extra: Partial<Pick<Badge, 'relatedGoalId' | 'relatedGigId' | 'streakCount'>> = {}
  ) => {
    const entry = getBadgeCatalogEntry(catalogId);
    const badge: Badge = {
      id: makeId('badge'),
      childProfileId: childProfile?.id ?? '',
      catalogId,
      type: entry?.type ?? 'streak',
      earnedAt: new Date().toISOString(),
      ...extra,
    };
    setBadges((prev) => [...prev, badge]);
  };

  const markExpectedDone = (expectedItemId: string): MarkExpectedDoneResult => {
    const noOp: MarkExpectedDoneResult = { newBadgeCatalogId: null, allDoneToday: false, allWeeklyDoneThisWeek: false };
    if (isExpectedDoneToday(expectedItemId)) return noOp;
    const item = expectedItems.find((i) => i.id === expectedItemId);
    if (!item) return noOp;

    const completion: ExpectedCompletion = {
      id: makeId('expectedCompletion'),
      expectedItemId,
      childProfileId: childProfile?.id ?? '',
      date: todayString(),
      markedDoneAt: new Date().toISOString(),
      correctedByParent: false,
    };
    setExpectedCompletions((prev) => [...prev, completion]);

    // expectedCompletions state hasn't updated yet in this closure — include
    // the pending completion directly so today's picture reflects this tap.
    // Only the tapped item's own frequency can complete its own period —
    // otherwise checking off a weekly item after the daily set is already
    // done would re-fire the daily "all done today" celebration (and vice
    // versa), even though this tap didn't actually complete that period.
    const today = todayString();
    const updatedCompletions = [...expectedCompletions, completion];
    const dailyItems = expectedItems.filter((i) => i.frequency === 'daily');
    const weeklyItems = expectedItems.filter((i) => i.frequency === 'weekly');
    const allDoneToday =
      item.frequency === 'daily' &&
      dailyItems.length > 0 &&
      dailyItems.every((i) => isExpectedItemSatisfied(i, updatedCompletions, today));
    const allWeeklyDoneThisWeek =
      item.frequency === 'weekly' &&
      weeklyItems.length > 0 &&
      weeklyItems.every((i) => isExpectedItemSatisfied(i, updatedCompletions, today));

    let newBadgeCatalogId: string | null = null;
    if (allDoneToday) {
      const newStreak = computeExpectedStreak(expectedItems, updatedCompletions, today);
      const threshold = STREAK_THRESHOLDS.find((t) => t.days === newStreak);
      if (threshold && !hasBadge(threshold.catalogId)) {
        awardBadge(threshold.catalogId, { streakCount: newStreak });
        newBadgeCatalogId = threshold.catalogId;
      }
    } else if (allWeeklyDoneThisWeek && !hasBadge('weekly_expected_done')) {
      awardBadge('weekly_expected_done');
      newBadgeCatalogId = 'weekly_expected_done';
    }
    return { newBadgeCatalogId, allDoneToday, allWeeklyDoneThisWeek };
  };

  // Only daily items gate Gigs — a weekly item (e.g. "tidy your room") has
  // the rest of the week to get done, so it shouldn't block today's Gigs
  // the same way an undone daily item does.
  const allExpectedDoneToday = (): boolean => {
    const dailyItems = expectedItems.filter((item) => item.frequency === 'daily');
    if (dailyItems.length === 0) return false;
    return dailyItems.every((item) => isExpectedDoneToday(item.id));
  };

  const expectedDoneCountToday = () => {
    const dailyItems = expectedItems.filter((item) => item.frequency === 'daily');
    const done = dailyItems.filter((item) => isExpectedDoneToday(item.id)).length;
    return { done, total: dailyItems.length };
  };

  const expectedStreak = (): number => computeExpectedStreak(expectedItems, expectedCompletions, todayString());

  const activeGoal = (): Goal | undefined => goals.find((g) => g.status === 'active');
  const queuedGoals = (): Goal[] =>
    goals.filter((g) => g.status === 'queued').sort((a, b) => a.queuePosition - b.queuePosition);
  const completedGoals = (): Goal[] =>
    goals
      .filter((g) => g.status === 'achieved' || g.status === 'fulfilled')
      .sort((a, b) => (b.achievedAt ?? '').localeCompare(a.achievedAt ?? ''));
  const getGoal = (goalId: string): Goal | undefined => goals.find((g) => g.id === goalId);

  const addGoal = (name: string, realWorldCost: number, category?: GoalCategory, photoUri?: string) => {
    const hasActive = goals.some((g) => g.status === 'active');
    const goal: Goal = {
      id: makeId('goal'),
      childProfileId: childProfile?.id ?? '',
      name,
      realWorldCost,
      queuePosition: goals.length,
      status: hasActive ? 'queued' : 'active',
      createdAt: new Date().toISOString(),
      category,
      photoUri,
    };
    setGoals((prev) => [...prev, goal]);
  };

  /** Promotes a queued goal to active, demoting the current active goal (if
   * any) back to queued. Progress isn't affected either way — each goal's
   * progress is derived from GigCompletions tied to its own id, independent
   * of which goal currently holds 'active' status. */
  const setActiveGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) return { ...g, status: 'active' as const };
        if (g.status === 'active') return { ...g, status: 'queued' as const };
        return g;
      })
    );
  };

  const goalProgressPercentage = (goalId: string): number => {
    return gigCompletions
      .filter((c) => c.goalId === goalId && c.status === 'approved')
      .reduce((sum, c) => sum + c.percentageAwarded, 0);
  };

  const todaysApprovedGigCount = (goalId: string): number => {
    const today = todayString();
    return gigCompletions.filter(
      (c) => c.goalId === goalId && c.status === 'approved' && (c.approvedAt ?? c.markedDoneAt).slice(0, 10) === today
    ).length;
  };

  const moveTodaysGigProgressToGoal = (fromGoalId: string, toGoalId: string) => {
    const toGoal = getGoal(toGoalId);
    if (!toGoal || !futureFund) return;
    const today = todayString();
    setGigCompletions((prev) =>
      prev.map((c) => {
        if (c.goalId !== fromGoalId || c.status !== 'approved') return c;
        if ((c.approvedAt ?? c.markedDoneAt).slice(0, 10) !== today) return c;
        const gig = gigs.find((g) => g.id === c.gigId);
        if (!gig) return c;
        const percentageAwarded = computeGigPercentage(gig.effortTier, toGoal, futureFund.percentage, gigEffortValues);
        return { ...c, goalId: toGoalId, percentageAwarded };
      })
    );
  };

  /** Only a non-active goal with zero earned progress is safe to edit or
   * delete — a goal that was ever active (even if since demoted back to
   * queued via setActiveGoal) could carry real progress worth protecting. */
  const canModifyGoal = (goalId: string): boolean => {
    const goal = getGoal(goalId);
    if (!goal) return false;
    return goal.status !== 'active' && goalProgressPercentage(goalId) === 0;
  };

  const updateGoal = (goalId: string, fields: { name: string; realWorldCost: number; photoUri?: string }) => {
    if (!canModifyGoal(goalId)) return;
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...fields } : g)));
  };

  const deleteGoal = (goalId: string) => {
    if (!canModifyGoal(goalId)) return;
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  /** Promotes the next queued goal (lowest queuePosition) to active, if
   * there is one. Used both when a goal is achieved (immediately opens the
   * slot for the next one) and — defensively — nowhere else, since that's
   * the only place a slot opens up. */
  const activateNextQueuedGoal = (list: Goal[]): Goal[] => {
    const queued = list.filter((g) => g.status === 'queued').sort((a, b) => a.queuePosition - b.queuePosition);
    const nextUp = queued[0];
    if (!nextUp) return list;
    return list.map((g) => (g.id === nextUp.id ? { ...g, status: 'active' as const } : g));
  };

  const markGoalFulfilled = (goalId: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, status: 'fulfilled' as const, fulfilledAt: new Date().toISOString() } : g))
    );
  };

  const gigPreviewPercentage = (gig: Gig): number | null => {
    const goal = activeGoal();
    if (!goal || !futureFund) return null;
    return computeGigPercentage(gig.effortTier, goal, futureFund.percentage, gigEffortValues);
  };

  const gigCompletionStatusToday = (gigId: string): GigCompletion['status'] | null => {
    const today = todayString();
    const completion = gigCompletions.find(
      (c) => c.gigId === gigId && c.markedDoneAt.slice(0, 10) === today
    );
    return completion?.status ?? null;
  };

  const markGigDone = (gigId: string): MarkGigDoneResult => {
    const noOp: MarkGigDoneResult = { achievedGoal: false, newBadgeCatalogId: null, allGigsDoneToday: false };
    const goal = activeGoal();
    if (!goal || !futureFund) return noOp;
    if (gigCompletionStatusToday(gigId) !== null) return noOp;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return noOp;

    const percentageAwarded = computeGigPercentage(gig.effortTier, goal, futureFund.percentage, gigEffortValues);
    const grossValue = gigEffortValues[gig.effortTier];
    const skimAmount = grossValue * (futureFund.percentage / 100);

    const completion: GigCompletion = {
      id: makeId('gigCompletion'),
      gigId,
      childProfileId: childProfile?.id ?? '',
      goalId: goal.id,
      markedDoneAt: new Date().toISOString(),
      // Marked directly by the parent during check-in — since there's only
      // one user type (parent), there's no separate approval queue to defer
      // to. This counts toward goal progress immediately.
      status: 'approved',
      approvedAt: new Date().toISOString(),
      isRetry: false,
      percentageAwarded,
    };
    const updatedCompletions = [...gigCompletions, completion];
    setGigCompletions(updatedCompletions);
    setFutureFund((prev) => (prev ? { ...prev, balance: prev.balance + skimAmount } : prev));

    const today = todayString();
    const activeGigs = gigs.filter((g) => g.active);
    const allGigsDoneToday = activeGigs.every((g) =>
      updatedCompletions.some((c) => c.gigId === g.id && c.markedDoneAt.slice(0, 10) === today)
    );

    const priorProgress = goalProgressPercentage(goal.id);
    const achievedGoal = priorProgress + percentageAwarded >= 100;
    if (achievedGoal) {
      setGoals((prev) => {
        const withAchieved = prev.map((g) =>
          g.id === goal.id ? { ...g, status: 'achieved' as const, achievedAt: new Date().toISOString() } : g
        );
        // The next queued goal activates immediately, not gated behind the
        // parent later confirming fulfillment — see markGoalFulfilled.
        return activateNextQueuedGoal(withAchieved);
      });
    }

    // All qualifying badges get recorded, but only one popup ever surfaces
    // per tap — goal-achieved is silent (the goal celebration IS that
    // moment), so the first of big-job/milestone wins the popup.
    let newBadgeCatalogId: string | null = null;
    if (achievedGoal && !hasBadge('goal_achieved')) {
      awardBadge('goal_achieved', { relatedGoalId: goal.id });
    }
    if (gig.effortTier === 'big_job' && !hasBadge('big_job_done')) {
      awardBadge('big_job_done', { relatedGigId: gig.id });
      if (!achievedGoal) newBadgeCatalogId = newBadgeCatalogId ?? 'big_job_done';
    }
    const newFutureFundBalance = futureFund.balance + skimAmount;
    const futureFundMilestone = FUTURE_FUND_THRESHOLDS.find(
      (t) => futureFund.balance < t.amount && newFutureFundBalance >= t.amount
    );
    if (futureFundMilestone && !hasBadge(futureFundMilestone.catalogId)) {
      awardBadge(futureFundMilestone.catalogId);
      if (!achievedGoal) newBadgeCatalogId = newBadgeCatalogId ?? futureFundMilestone.catalogId;
    }
    const approvedCount = updatedCompletions.filter((c) => c.status === 'approved').length;
    const gigMilestone = GIG_MILESTONE_THRESHOLDS.find((t) => t.count === approvedCount);
    if (gigMilestone && !hasBadge(gigMilestone.catalogId)) {
      awardBadge(gigMilestone.catalogId, { relatedGigId: gig.id });
      if (!achievedGoal) newBadgeCatalogId = newBadgeCatalogId ?? gigMilestone.catalogId;
    }

    // Same muting rule as the badge popups above — the goal-achieved
    // celebration takes precedence over "all gigs done" in the same tap.
    return { achievedGoal, newBadgeCatalogId, allGigsDoneToday: achievedGoal ? false : allGigsDoneToday };
  };

  const recordFutureFundContribution = (amount: number) => {
    setFutureFund((prev) => (prev ? { ...prev, balance: Math.max(0, prev.balance - amount) } : prev));
  };

  const addScheduleEvent = (event: Omit<ScheduleEvent, 'id' | 'childProfileId'>) => {
    setScheduleEvents((prev) => [...prev, { ...event, id: makeId('scheduleEvent'), childProfileId: childProfile?.id ?? '' }]);
  };

  const updateScheduleEvent = (id: string, fields: Omit<ScheduleEvent, 'id' | 'childProfileId'>) => {
    setScheduleEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...fields } : e)));
  };

  const deleteScheduleEvent = (id: string) => {
    setScheduleEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const addExpectedItem = (item: { name: string; frequency: ExpectedItem['frequency'] }) => {
    setExpectedItems((prev) => [
      ...prev,
      { id: makeId('expectedItem'), childProfileId: childProfile?.id ?? '', name: item.name, frequency: item.frequency, active: true },
    ]);
  };

  const updateExpectedItem = (id: string, fields: { name: string; frequency: ExpectedItem['frequency'] }) => {
    setExpectedItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...fields } : item)));
  };

  const deleteExpectedItem = (id: string) => {
    setExpectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addGig = (gig: { name: string; effortTier: Gig['effortTier'] }) => {
    setGigs((prev) => [
      ...prev,
      { id: makeId('gig'), childProfileId: childProfile?.id ?? '', name: gig.name, effortTier: gig.effortTier, active: true },
    ]);
  };

  const updateGig = (id: string, fields: { name: string; effortTier: Gig['effortTier'] }) => {
    setGigs((prev) => prev.map((g) => (g.id === id ? { ...g, ...fields } : g)));
  };

  const deleteGig = (id: string) => {
    setGigs((prev) => prev.filter((g) => g.id !== id));
  };

  const updateGigEffortValues = (values: GigEffortValues) => {
    setGigEffortValues(values);
  };

  /** Clears persisted storage and all in-memory state — back to a fresh
   * install. Mainly a testing convenience now that data survives restarts.
   * Also clears the server's copy (best-effort) if this account is synced
   * — otherwise the ordinary per-change sync below would just push these
   * same empty values up right after, but silently and without the same
   * "this can't be undone" framing the confirmation dialog already gives
   * local data. Explicit here instead. */
  const resetAllData = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setParentName(null);
    setChildProfile(null);
    setScheduleEvents([]);
    setExpectedItems([]);
    setExpectedCompletions([]);
    setGigs([]);
    setGigCompletions([]);
    setGoals([]);
    setFutureFund(null);
    setGigEffortValues(DEFAULT_GIG_EFFORT_VALUES);
    setBadges([]);
    if (token) {
      saveData(token, null).catch((e) => console.warn('Failed to clear server app data', e));
    }
  };

  return (
    <AppDataContext.Provider
      value={{
        isHydrated,
        parentName,
        childProfile,
        updateChildProfile,
        updateParentName,
        scheduleEvents,
        expectedItems,
        expectedCompletions,
        gigs,
        gigCompletions,
        goals,
        futureFund,
        gigEffortValues,
        badges,
        soundEnabled,
        setSoundEnabled,
        completeSetup,
        isExpectedDoneToday,
        markExpectedDone,
        allExpectedDoneToday,
        expectedDoneCountToday,
        expectedStreak,
        activeGoal,
        queuedGoals,
        completedGoals,
        getGoal,
        addGoal,
        setActiveGoal,
        canModifyGoal,
        updateGoal,
        deleteGoal,
        goalProgressPercentage,
        todaysApprovedGigCount,
        moveTodaysGigProgressToGoal,
        markGoalFulfilled,
        gigPreviewPercentage,
        gigCompletionStatusToday,
        markGigDone,
        recordFutureFundContribution,
        addScheduleEvent,
        updateScheduleEvent,
        deleteScheduleEvent,
        addExpectedItem,
        updateExpectedItem,
        deleteExpectedItem,
        addGig,
        updateGig,
        deleteGig,
        updateGigEffortValues,
        resetAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within an AppDataProvider');
  return ctx;
}
