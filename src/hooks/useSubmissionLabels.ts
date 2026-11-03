import { Submission } from '../types/models';
import { useAppData } from '../context/AppDataContext';

export interface SubmissionLabel {
  title: string;
  detail?: string;
  /** Goal requests open their own screen (they need a price or a closer look). */
  isGoal: boolean;
  color: 'teal' | 'amber';
}

/** Plain-language names for what a child sent in, looked up in the family's data. */
export function useSubmissionLabels(): (s: Submission) => SubmissionLabel {
  const { householdExpectedItems, householdGigs, householdGoals, gigPercentFor } = useAppData();
  return (s) => {
    const goalName = (id: string) => householdGoals.find((g) => g.id === id)?.name ?? 'a goal';
    const activeGoalFor = (childId: string) =>
      householdGoals.find((g) => g.childProfileId === childId && g.status === 'active');
    switch (s.kind) {
      case 'expected':
        return {
          title: householdExpectedItems.find((i) => i.id === s.itemId)?.name ?? 'An activity that was removed',
          isGoal: false,
          color: 'teal',
        };
      case 'gig': {
        const percent = gigPercentFor(s.childId, s.itemId);
        const goal = activeGoalFor(s.childId);
        return {
          title: householdGigs.find((g) => g.id === s.itemId)?.name ?? 'A gig that was removed',
          detail: percent !== null && goal ? `+${percent}% toward ${goal.name}` : 'Needs a goal first',
          isGoal: false,
          color: 'amber',
        };
      }
      case 'goal_add':
        return { title: `New goal: ${s.payload.name ?? ''}`, detail: 'Set a price to approve', isGoal: true, color: 'amber' };
      case 'goal_rename':
        return {
          title: `Rename goal: ${goalName(s.itemId)}`,
          detail: `to “${s.payload.name ?? ''}”`,
          isGoal: true,
          color: 'amber',
        };
      case 'goal_switch': {
        const current = activeGoalFor(s.childId);
        return {
          title: `Switch goal to: ${goalName(s.itemId)}`,
          detail: current ? `Current goal: ${current.name}` : undefined,
          isGoal: true,
          color: 'amber',
        };
      }
    }
  };
}
