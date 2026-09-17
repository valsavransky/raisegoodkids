// Data model for Merit — see docs/screens-and-flows.md and
// docs/vision-doc-kids-goals-app.md for the product decisions behind these shapes.

/** One login per household. Holds one or more ChildProfiles. No separate
 * child credentials in v1 — the child interacts through the parent's device. */
export interface ParentAccount {
  id: string;
  email: string;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  parentAccountId: string;
  name: string;
  avatarId: string;
  birthday: string;
  /** Feeds age/grade content library suggestions. */
  grade?: string;
  /** Household facts, not really properties of the child — collected here
   * since there's no separate household entity yet (one profile per
   * account in v1). Feeds the content library's `ifApplicable` gig
   * filtering and a couple of pet-based Expected/Gig suggestions. */
  hasYard?: boolean;
  hasCar?: boolean;
  hasPet?: boolean;
  /** Free text (e.g. "dog", "cat") — only meaningful when hasPet is true. */
  petType?: string;
  /** Only meaningful when hasPet is true; optional even then. */
  petName?: string;
}

// 'skip' (hide from the schedule) was removed — redundant with just not
// importing/deleting an event, and confusing on manual add (see
// docs/screens-and-flows.md). 'practice' was folded into 'music'/'sports'
// (which is which now depends on the activity, not a separate tag); 'other'
// is the new safe catch-all for anything that isn't naturally one of the
// four real categories (an appointment, a playdate) — shows on the
// schedule like everything else, just never triggers a suggested Expected
// item (see src/data/practiceSuggestions.ts).
export type ScheduleEventCategory = 'school' | 'sports' | 'extracurricular' | 'music' | 'other';
export type ScheduleEventSource = 'google_calendar' | 'manual';

/** How often a recurring event repeats. Google Calendar imports derive this
 * from the event's RRULE (see googleCalendarApi.ts); manually-added events
 * only offer 'weekly' through the UI today, since that covers the vast
 * majority of household recurring commitments (school, lessons, practice). */
export type ScheduleEventCadence = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export const CADENCE_LABELS: Record<ScheduleEventCadence, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

/** From calendar import/review (screens 5-6) — informs realistic Expected/Gig capacity,
 * and backs the schedule view. Structured rather than free-form, matching the
 * metadata a real calendar event carries (name, date/time, whether it repeats). */
export interface ScheduleEvent {
  id: string;
  childProfileId: string;
  title: string;
  category: ScheduleEventCategory;
  recurring: boolean;
  /** 0=Sunday..6=Saturday. Only set when recurring. */
  daysOfWeek?: number[];
  /** Only set when recurring; defaults to 'weekly' when absent (the only
   * cadence the old manual-entry UI ever produced), so existing data reads
   * the same as before this field existed. */
  cadence?: ScheduleEventCadence;
  /** YYYY-MM-DD. Only set when NOT recurring (a one-off event). */
  date?: string;
  /** HH:MM, 24-hour. */
  startTime?: string;
  endTime?: string;
  source: ScheduleEventSource;
}

/**
 * Unpaid, non-negotiable responsibility. No effort tier or dollar value.
 *
 * v1 intentionally has no per-item excusable flag: screens-and-flows.md specs
 * a single all-or-nothing daily excuse (see DailyExcuse) rather than a mixed
 * excusable/always-required list. The per-item split is a fast-follow
 * (screens 16-17) — add an `excusable: boolean` column then, not now.
 */
export interface ExpectedItem {
  id: string;
  childProfileId: string;
  name: string;
  frequency: 'daily' | 'weekly';
  active: boolean;
  /** Title of the schedule event this item was suggested from (e.g. "Rayna
   * piano"), when accepted via the practice-suggestion prompt on
   * ScheduleReviewScreen — shown as a subtitle in the Expected Items list so
   * it's clear why the item exists. A plain title snapshot, not a live
   * reference to the ScheduleEvent, so it survives that event being edited
   * or deleted later. Absent for items added directly (manual add, or
   * content-library suggestions with no calendar event behind them). */
  linkedEventTitle?: string;
}

/** Self-marked by the child — no per-item parent approval, since nothing
 * financial is at stake. Parents can correct these after the fact in the
 * "today's recap" view (screen 15). */
export interface ExpectedCompletion {
  id: string;
  expectedItemId: string;
  childProfileId: string;
  /** Calendar date (YYYY-MM-DD) this completion applies to. */
  date: string;
  markedDoneAt: string;
  correctedByParent: boolean;
  correctedAt?: string;
}

export type DailyExcuseTrigger = 'birthday' | 'holiday' | 'manual';
export type DailyExcuseReason = 'sick' | 'travel' | 'family_event' | 'other';

/** v1's single all-or-nothing "excuse today" toggle (screens 16-17's fuller
 * per-item excusable/always-required split is a fast-follow, not v1 scope). */
export interface DailyExcuse {
  id: string;
  childProfileId: string;
  date: string;
  trigger: DailyExcuseTrigger;
  /** Only set for trigger === 'manual'; not shown to the child. */
  reason?: DailyExcuseReason;
}

export type GigEffortTier = 'quick' | 'medium' | 'big_job';

/** Parent-configurable dollar value per effort tier — what a completed gig
 * at that tier is actually worth before the Future Fund skim (see
 * src/utils/gigValue.ts). Never shown to the child; only used to compute
 * goal-progress percentage on the parent side. */
export type GigEffortValues = Record<GigEffortTier, number>;

/** Optional, paid work. No dollar value shown to the child — see GigCompletion
 * for how a completion's value is expressed as goal-progress percentage. */
export interface Gig {
  id: string;
  childProfileId: string;
  name: string;
  effortTier: GigEffortTier;
  active: boolean;
}

export type GigCompletionStatus = 'pending' | 'approved' | 'declined';

/** Requires explicit parent approval before counting toward goal progress,
 * since real goal/money progress is on the line. */
export interface GigCompletion {
  id: string;
  gigId: string;
  childProfileId: string;
  goalId: string;
  markedDoneAt: string;
  status: GigCompletionStatus;
  approvedAt?: string;
  declinedAt?: string;
  declineNote?: string;
  /** True when this is a resubmission after a prior decline — triggers the
   * "grit" character badge on approval (screen 10). */
  isRetry: boolean;
  /** Percentage of the active goal this completion was worth, computed at
   * approval time from the gig's effort tier and the goal's cost. */
  percentageAwarded: number;
}

export type GoalStatus = 'queued' | 'active' | 'achieved' | 'fulfilled';

/**
 * Goals are queued, not concurrent — one active goal at a time, others wait
 * in order (queuePosition). Progress is NOT stored here: it's derived by
 * summing approved GigCompletion.percentageAwarded for this goal, so a
 * later-corrected completion can't leave the goal record out of sync.
 */
/** Powers "Suggested for you" on the Goal tab (see src/data/goalIdeas.ts) —
 * set once when a goal is added, by keyword match against its name, or by
 * asking Claude when no keyword matches (e.g. a brand name like "Needo";
 * see server/src/goals.ts). Absent for goals added before this field
 * existed, or when neither method found a confident category. */
export type GoalCategory = 'toys' | 'games' | 'tech' | 'sports' | 'creative' | 'experience';

export interface Goal {
  id: string;
  childProfileId: string;
  name: string;
  /** Real-world cost, parent-entered. Not shown to the child as a raw figure. */
  realWorldCost: number;
  queuePosition: number;
  status: GoalStatus;
  createdAt: string;
  achievedAt?: string;
  fulfilledAt?: string;
  category?: GoalCategory;
  /** A photo the parent/child attached from their photo library — typically
   * saved from the "Search Google Images" link, but any photo works.
   * Stored as a local file URI, not uploaded anywhere, so it's device-local
   * only and won't follow the goal across a cross-device account recovery. */
  photoUri?: string;
}

/** Fixed "pay yourself first" skim off every gig's earned value, taken before
 * the remainder counts toward the active goal. Single global percentage per
 * child, not a second goal-splitting system. Balance is parent-tracked (no
 * brokerage integration in v1). */
export interface FutureFund {
  id: string;
  childProfileId: string;
  percentage: number;
  balance: number;
  milestoneThreshold: number;
  lastMilestoneNotifiedAt?: string;
}

export type BadgeType =
  | 'streak'
  | 'gig_milestone'
  | 'big_job_done'
  | 'goal_achieved'
  | 'character_grit'
  | 'future_fund_milestone';

/**
 * Streak length and goal-progress percentage are deliberately NOT stored as
 * mutable counters anywhere in this model — both are derived (streak from
 * ExpectedCompletion history, goal progress from approved GigCompletions) to
 * avoid a second source of truth that can drift from corrections.
 */
export interface Badge {
  id: string;
  childProfileId: string;
  /** Which fixed badge-shelf definition this is (see src/data/badgeCatalog.ts).
   * The shelf is a fixed catalog, each earnable once — this is how "already
   * earned?" is checked, since `type` alone doesn't distinguish e.g. a
   * 3-day streak badge from a 30-day one. */
  catalogId: string;
  type: BadgeType;
  earnedAt: string;
  relatedGoalId?: string;
  relatedGigId?: string;
  /** Set only for type === 'streak'. */
  streakCount?: number;
}
