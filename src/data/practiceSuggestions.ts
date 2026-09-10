// Rules-based (not AI) lookup for the two calendar-import payoff mechanisms
// on screen 6 of docs/screens-and-flows.md:
//   1. A best-guess category for an imported event, shown pre-filled on the
//      review/tagging screen.
//   2. A suggested related Expected item, surfaced the moment an event gets
//      tagged Practice or School — cheaper, more predictable, and avoids
//      sending a child's calendar data to a third party for something a
//      lookup table handles fine.
import { ScheduleEventCategory } from '../types/models';

const INSTRUMENT_KEYWORDS: { keyword: string; instrument: string }[] = [
  { keyword: 'piano', instrument: 'piano' },
  { keyword: 'violin', instrument: 'violin' },
  { keyword: 'viola', instrument: 'viola' },
  { keyword: 'cello', instrument: 'cello' },
  { keyword: 'guitar', instrument: 'guitar' },
  { keyword: 'drum', instrument: 'drums' },
  { keyword: 'flute', instrument: 'flute' },
  { keyword: 'clarinet', instrument: 'clarinet' },
  { keyword: 'trumpet', instrument: 'trumpet' },
  { keyword: 'saxophone', instrument: 'saxophone' },
  { keyword: 'voice lesson', instrument: 'voice' },
  { keyword: 'singing lesson', instrument: 'voice' },
];

// Only subjects with a genuine daily-practice pattern (per the spec) — not
// every school subject has homework worth a standing Expected item.
const SUBJECT_KEYWORDS: { keyword: string; subject: string }[] = [
  { keyword: 'math', subject: 'math' },
  { keyword: 'reading', subject: 'reading' },
  { keyword: 'spelling', subject: 'spelling' },
];

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Best-guess category for an event title pulled from the calendar — always
 * just a starting point, correctable by the parent on the review screen. */
export function guessCategoryForTitle(title: string): ScheduleEventCategory {
  const lower = title.toLowerCase();
  if (INSTRUMENT_KEYWORDS.some((i) => lower.includes(i.keyword))) return 'practice';
  if (/\b(school|class|homeroom)\b/.test(lower)) return 'school';
  if (SUBJECT_KEYWORDS.some((s) => lower.includes(s.keyword)) && /(tutor|homework|study)/.test(lower)) {
    return 'school';
  }
  return 'extracurricular';
}

/** Only Practice and School tags plausibly have a related daily habit worth
 * suggesting (an extracurricular like "Soccer Practice" doesn't). */
export function categoryTriggersSuggestion(category: ScheduleEventCategory): boolean {
  return category === 'practice' || category === 'school';
}

export interface ExpectedItemSuggestion {
  /** Pre-filled suggested name, or '' when nothing in the lookup matched
   * (the generic fallback — parent names it themselves). */
  name: string;
  isGeneric: boolean;
}

export function suggestExpectedItemForEvent(title: string): ExpectedItemSuggestion {
  const lower = title.toLowerCase();
  const instrument = INSTRUMENT_KEYWORDS.find((i) => lower.includes(i.keyword));
  if (instrument) {
    return { name: `Practice ${capitalize(instrument.instrument)}`, isGeneric: false };
  }
  const subject = SUBJECT_KEYWORDS.find((s) => lower.includes(s.keyword));
  if (subject) {
    return { name: `Complete ${capitalize(subject.subject)} homework`, isGeneric: false };
  }
  return { name: '', isGeneric: true };
}
