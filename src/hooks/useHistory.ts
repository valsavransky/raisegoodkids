import { useAppData } from '../context/AppDataContext';
import { todayString } from '../utils/date';
import { HistoryInput } from '../utils/history';

/** The selected child's data shaped for the History utilities. */
export function useHistoryInput(): HistoryInput {
  const { expectedItems, expectedCompletions, gigCompletions, isDayExcused } = useAppData();
  return {
    items: expectedItems,
    completions: expectedCompletions,
    gigCompletions,
    isExcused: (date) => isDayExcused(date),
    today: todayString(),
  };
}
