// Runtime data for the "live" app, as opposed to SetupContext's in-progress
// wizard draft. Seeded once from that draft when setup finishes. Nothing
// here is persisted yet — it resets if the app reloads. No backend, no
// storage layer (that's still ahead of us).
import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  ChildProfile,
  ScheduleEvent,
  ExpectedItem,
  ExpectedCompletion,
  Gig,
  GigCompletion,
  Goal,
  FutureFund,
  Badge,
} from '../types/models';
import { DraftChildProfile, DraftScheduleEvent, DraftExpectedItem, DraftGig } from './SetupContext';
import { makeId } from '../utils/id';
import { todayString } from '../utils/date';
import { computeExpectedStreak } from '../utils/streak';
import { computeGigPercentage, EFFORT_TIER_DOLLAR_VALUES } from '../utils/gigValue';
import { STREAK_THRESHOLDS, GIG_MILESTONE_THRESHOLDS, FUTURE_FUND_THRESHOLDS, getBadgeCatalogEntry } from '../data/badgeCatalog';

const DEFAULT_FUTURE_FUND_PERCENTAGE = 10;

export interface MarkGigDoneResult {
  achievedGoal: boolean;
  /** A newly-earned badge's catalogId, if any — only ever set when the goal
   * WASN'T also achieved this tap, so the bigger goal-achieved celebration
   * doesn't get upstaged by a badge popup in the same instant. The badge is
   * still recorded either way; it just surfaces on the shelf instead. */
  newBadgeCatalogId: string | null;
}

export interface MarkExpectedDoneResult {
  /** A newly-earned streak badge's catalogId, if any. Since a streak day
   * only counts when every Expected item was done that day, this can only
   * ever be set alongside allDoneToday === true. */
  newBadgeCatalogId: string | null;
  /** True exactly once per day — on the tap that completes the last
   * remaining Expected item — so callers can show the "all done today"
   * celebration. */
  allDoneToday: boolean;
}

interface AppDataContextValue {
  childProfile: ChildProfile | null;
  scheduleEvents: ScheduleEvent[];
  expectedItems: ExpectedItem[];
  expectedCompletions: ExpectedCompletion[];
  gigs: Gig[];
  gigCompletions: GigCompletion[];
  goals: Goal[];
  futureFund: FutureFund | null;
  badges: Badge[];

  completeSetup: (draft: {
    childProfile: DraftChildProfile;
    scheduleEvents: DraftScheduleEvent[];
    expectedItems: DraftExpectedItem[];
    gigs: DraftGig[];
  }) => void;

  isExpectedDoneToday: (expectedItemId: string) => boolean;
  markExpectedDone: (expectedItemId: string) => MarkExpectedDoneResult;
  allExpectedDoneToday: () => boolean;
  expectedDoneCountToday: () => { done: number; total: number };
  expectedStreak: () => number;

  activeGoal: () => Goal | undefined;
  queuedGoals: () => Goal[];
  completedGoals: () => Goal[];
  getGoal: (goalId: string) => Goal | undefined;
  addGoal: (name: string, realWorldCost: number) => void;
  setActiveGoal: (goalId: string) => void;
  /** Only allowed for a non-active goal with zero progress recorded against
   * it — a goal that was ever active could carry real earned progress. */
  canModifyGoal: (goalId: string) => boolean;
  updateGoal: (goalId: string, fields: { name: string; realWorldCost: number }) => void;
  deleteGoal: (goalId: string) => void;
  goalProgressPercentage: (goalId: string) => number;
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
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [expectedItems, setExpectedItems] = useState<ExpectedItem[]>([]);
  const [expectedCompletions, setExpectedCompletions] = useState<ExpectedCompletion[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [gigCompletions, setGigCompletions] = useState<GigCompletion[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [futureFund, setFutureFund] = useState<FutureFund | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);

  const completeSetup: AppDataContextValue['completeSetup'] = (draft) => {
    const childId = makeId('child');
    setChildProfile({
      id: childId,
      parentAccountId: 'local-parent',
      name: draft.childProfile.name,
      avatarId: draft.childProfile.avatarId,
      birthday: draft.childProfile.birthday,
      grade: draft.childProfile.grade,
    });
    setScheduleEvents(
      draft.scheduleEvents.map((e) => ({
        id: makeId('scheduleEvent'),
        childProfileId: childId,
        title: e.title,
        category: e.category,
        recurring: e.recurring,
        daysOfWeek: e.daysOfWeek,
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
    const today = todayString();
    return expectedCompletions.some((c) => c.expectedItemId === expectedItemId && c.date === today);
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
    const noOp: MarkExpectedDoneResult = { newBadgeCatalogId: null, allDoneToday: false };
    if (isExpectedDoneToday(expectedItemId)) return noOp;
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
    const today = todayString();
    const updatedCompletions = [...expectedCompletions, completion];
    const allDoneToday =
      expectedItems.length > 0 &&
      expectedItems.every((item) => updatedCompletions.some((c) => c.expectedItemId === item.id && c.date === today));

    const newStreak = computeExpectedStreak(expectedItems, updatedCompletions, today);
    const threshold = STREAK_THRESHOLDS.find((t) => t.days === newStreak);
    let newBadgeCatalogId: string | null = null;
    if (threshold && !hasBadge(threshold.catalogId)) {
      awardBadge(threshold.catalogId, { streakCount: newStreak });
      newBadgeCatalogId = threshold.catalogId;
    }
    return { newBadgeCatalogId, allDoneToday };
  };

  const allExpectedDoneToday = (): boolean => {
    if (expectedItems.length === 0) return false;
    return expectedItems.every((item) => isExpectedDoneToday(item.id));
  };

  const expectedDoneCountToday = () => {
    const done = expectedItems.filter((item) => isExpectedDoneToday(item.id)).length;
    return { done, total: expectedItems.length };
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

  const addGoal = (name: string, realWorldCost: number) => {
    const hasActive = goals.some((g) => g.status === 'active');
    const goal: Goal = {
      id: makeId('goal'),
      childProfileId: childProfile?.id ?? '',
      name,
      realWorldCost,
      queuePosition: goals.length,
      status: hasActive ? 'queued' : 'active',
      createdAt: new Date().toISOString(),
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

  /** Only a non-active goal with zero earned progress is safe to edit or
   * delete — a goal that was ever active (even if since demoted back to
   * queued via setActiveGoal) could carry real progress worth protecting. */
  const canModifyGoal = (goalId: string): boolean => {
    const goal = getGoal(goalId);
    if (!goal) return false;
    return goal.status !== 'active' && goalProgressPercentage(goalId) === 0;
  };

  const updateGoal = (goalId: string, fields: { name: string; realWorldCost: number }) => {
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
    return computeGigPercentage(gig.effortTier, goal, futureFund.percentage);
  };

  const gigCompletionStatusToday = (gigId: string): GigCompletion['status'] | null => {
    const today = todayString();
    const completion = gigCompletions.find(
      (c) => c.gigId === gigId && c.markedDoneAt.slice(0, 10) === today
    );
    return completion?.status ?? null;
  };

  const markGigDone = (gigId: string): MarkGigDoneResult => {
    const noOp: MarkGigDoneResult = { achievedGoal: false, newBadgeCatalogId: null };
    const goal = activeGoal();
    if (!goal || !futureFund) return noOp;
    if (gigCompletionStatusToday(gigId) !== null) return noOp;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return noOp;

    const percentageAwarded = computeGigPercentage(gig.effortTier, goal, futureFund.percentage);
    const grossValue = EFFORT_TIER_DOLLAR_VALUES[gig.effortTier];
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

    return { achievedGoal, newBadgeCatalogId };
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

  return (
    <AppDataContext.Provider
      value={{
        childProfile,
        scheduleEvents,
        expectedItems,
        expectedCompletions,
        gigs,
        gigCompletions,
        goals,
        futureFund,
        badges,
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
