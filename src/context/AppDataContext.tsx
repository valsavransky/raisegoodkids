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
} from '../types/models';
import { DraftChildProfile, DraftScheduleEvent, DraftExpectedItem, DraftGig } from './SetupContext';
import { makeId } from '../utils/id';
import { todayString } from '../utils/date';
import { computeExpectedStreak } from '../utils/streak';
import { computeGigPercentage } from '../utils/gigValue';

const DEFAULT_FUTURE_FUND_PERCENTAGE = 10;

interface AppDataContextValue {
  childProfile: ChildProfile | null;
  scheduleEvents: ScheduleEvent[];
  expectedItems: ExpectedItem[];
  expectedCompletions: ExpectedCompletion[];
  gigs: Gig[];
  gigCompletions: GigCompletion[];
  goals: Goal[];
  futureFund: FutureFund | null;

  completeSetup: (draft: {
    childProfile: DraftChildProfile;
    scheduleEvents: DraftScheduleEvent[];
    expectedItems: DraftExpectedItem[];
    gigs: DraftGig[];
  }) => void;

  isExpectedDoneToday: (expectedItemId: string) => boolean;
  markExpectedDone: (expectedItemId: string) => void;
  allExpectedDoneToday: () => boolean;
  expectedDoneCountToday: () => { done: number; total: number };
  expectedStreak: () => number;

  activeGoal: () => Goal | undefined;
  queuedGoals: () => Goal[];
  addGoal: (name: string, realWorldCost: number) => void;
  goalProgressPercentage: (goalId: string) => number;

  gigPreviewPercentage: (gig: Gig) => number | null;
  gigCompletionStatusToday: (gigId: string) => GigCompletion['status'] | null;
  markGigDone: (gigId: string) => void;
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
      milestoneThreshold: 100,
    });
  };

  const isExpectedDoneToday = (expectedItemId: string): boolean => {
    const today = todayString();
    return expectedCompletions.some((c) => c.expectedItemId === expectedItemId && c.date === today);
  };

  const markExpectedDone = (expectedItemId: string) => {
    if (isExpectedDoneToday(expectedItemId)) return;
    const completion: ExpectedCompletion = {
      id: makeId('expectedCompletion'),
      expectedItemId,
      childProfileId: childProfile?.id ?? '',
      date: todayString(),
      markedDoneAt: new Date().toISOString(),
      correctedByParent: false,
    };
    setExpectedCompletions((prev) => [...prev, completion]);
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

  const addGoal = (name: string, realWorldCost: number) => {
    const hasActive = goals.some((g) => g.status === 'active');
    const goal: Goal = {
      id: makeId('goal'),
      childProfileId: childProfile?.id ?? '',
      name,
      realWorldCost,
      queuePosition: goals.length,
      status: hasActive ? 'queued' : 'active',
    };
    setGoals((prev) => [...prev, goal]);
  };

  const goalProgressPercentage = (goalId: string): number => {
    return gigCompletions
      .filter((c) => c.goalId === goalId && c.status === 'approved')
      .reduce((sum, c) => sum + c.percentageAwarded, 0);
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

  const markGigDone = (gigId: string) => {
    const goal = activeGoal();
    if (!goal || !futureFund) return;
    if (gigCompletionStatusToday(gigId) !== null) return;
    const gig = gigs.find((g) => g.id === gigId);
    if (!gig) return;
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
      percentageAwarded: computeGigPercentage(gig.effortTier, goal, futureFund.percentage),
    };
    setGigCompletions((prev) => [...prev, completion]);
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
        completeSetup,
        isExpectedDoneToday,
        markExpectedDone,
        allExpectedDoneToday,
        expectedDoneCountToday,
        expectedStreak,
        activeGoal,
        queuedGoals,
        addGoal,
        goalProgressPercentage,
        gigPreviewPercentage,
        gigCompletionStatusToday,
        markGigDone,
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
