// Rules-based (not AI) lookup for the two calendar-import/schedule-review
// payoff mechanisms on screen 6 of docs/screens-and-flows.md:
//   1. A best-guess category for an imported event, shown pre-filled on the
//      review/tagging screen.
//   2. A suggested related Expected item, surfaced the moment an event gets
//      tagged with a category that plausibly has one — cheaper, more
//      predictable, and avoids sending a child's calendar data to a third
//      party for something a lookup table handles fine.
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

const SPORTS_KEYWORDS: { keyword: string; sport: string }[] = [
  { keyword: 'soccer', sport: 'soccer' },
  { keyword: 'basketball', sport: 'basketball' },
  { keyword: 'baseball', sport: 'baseball' },
  { keyword: 'softball', sport: 'softball' },
  { keyword: 'swim', sport: 'swimming' },
  { keyword: 'tennis', sport: 'tennis' },
  { keyword: 'hockey', sport: 'hockey' },
  { keyword: 'football', sport: 'football' },
  { keyword: 'volleyball', sport: 'volleyball' },
  { keyword: 'track', sport: 'track' },
  { keyword: 'lacrosse', sport: 'lacrosse' },
  { keyword: 'wrestling', sport: 'wrestling' },
  { keyword: 'gymnastics', sport: 'gymnastics' },
  { keyword: 'cheer', sport: 'cheerleading' },
  { keyword: 'dance', sport: 'dance' },
  { keyword: 'ballet', sport: 'ballet' },
  { keyword: 'tumbling', sport: 'tumbling' },
  { keyword: 'karate', sport: 'karate' },
  { keyword: 'taekwondo', sport: 'taekwondo' },
  { keyword: 'martial arts', sport: 'martial arts' },
  { keyword: 'golf', sport: 'golf' },
];

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Best-guess category for an event title pulled from the calendar — always
 * just a starting point, correctable by the parent on the review screen.
 * Defaults to 'other' (not 'extracurricular') when nothing matches, since
 * 'extracurricular' now specifically triggers a practice suggestion —
 * an unrecognized title (a dentist appointment, a playdate) shouldn't get
 * one just because it didn't match anything more specific. */
export function guessCategoryForTitle(title: string): ScheduleEventCategory {
  const lower = title.toLowerCase();
  if (INSTRUMENT_KEYWORDS.some((i) => lower.includes(i.keyword))) return 'music';
  if (SPORTS_KEYWORDS.some((s) => lower.includes(s.keyword))) return 'sports';
  // Deliberately not matching the bare word "class" here (the original
  // version did) — it false-positives on "Theater class," "Art class,"
  // etc., which aren't core-subject school events. "School"/"homeroom" are
  // specific enough on their own; a subject name plus tutor/homework/study
  // below covers the rest.
  if (/\b(school|homeroom)\b/.test(lower)) return 'school';
  if (SUBJECT_KEYWORDS.some((s) => lower.includes(s.keyword)) && /(tutor|homework|study)/.test(lower)) {
    return 'school';
  }
  return 'other';
}

/** School, Music, and Extracurricular always plausibly have a related daily
 * habit worth suggesting. Sports only does when it's an actual practice,
 * not a game (see the practice/game follow-up in ScheduleReviewScreen) —
 * pass sportsIsPractice for that case. Other never does — it's the
 * deliberate no-suggestion catch-all. */
export function categoryTriggersSuggestion(
  category: ScheduleEventCategory,
  sportsIsPractice?: boolean
): boolean {
  if (category === 'sports') return sportsIsPractice === true;
  return category === 'school' || category === 'music' || category === 'extracurricular';
}

export interface ExpectedItemSuggestion {
  /** Pre-filled suggested name, or '' when nothing in the lookup matched
   * (the generic fallback — parent names it themselves). */
  name: string;
  isGeneric: boolean;
  /** Starting point for the cadence picker the parent can adjust (e.g. "20
   * min/day" for piano, "2 hrs/week" if they change it) — not used for the
   * generic fallback, since there's no informed default to suggest. */
  defaultFrequency: 'daily' | 'weekly';
  defaultDurationMinutes: number;
}

const GENERIC_SUGGESTION: ExpectedItemSuggestion = {
  name: '',
  isGeneric: true,
  defaultFrequency: 'daily',
  defaultDurationMinutes: 0,
};

/** Category-aware now, not just title-keyword matching against a single
 * combined list — a category picked directly (rather than guessed) still
 * deserves the right keyword list to check, e.g. a Sports event should
 * only ever try to match a sport, never an instrument. */
export function suggestExpectedItemForEvent(
  title: string,
  category: ScheduleEventCategory
): ExpectedItemSuggestion {
  const lower = title.toLowerCase();

  if (category === 'music') {
    const instrument = INSTRUMENT_KEYWORDS.find((i) => lower.includes(i.keyword));
    if (instrument) {
      return {
        name: `Practice ${capitalize(instrument.instrument)}`,
        isGeneric: false,
        defaultFrequency: 'daily',
        defaultDurationMinutes: 20,
      };
    }
    return GENERIC_SUGGESTION;
  }

  if (category === 'school') {
    const subject = SUBJECT_KEYWORDS.find((s) => lower.includes(s.keyword));
    if (subject) {
      return {
        name: `Complete ${capitalize(subject.subject)} homework`,
        isGeneric: false,
        defaultFrequency: 'daily',
        defaultDurationMinutes: 20,
      };
    }
    return GENERIC_SUGGESTION;
  }

  if (category === 'sports') {
    const sport = SPORTS_KEYWORDS.find((s) => lower.includes(s.keyword));
    if (sport) {
      return {
        name: `Practice ${capitalize(sport.sport)}`,
        isGeneric: false,
        defaultFrequency: 'weekly',
        defaultDurationMinutes: 30,
      };
    }
    return GENERIC_SUGGESTION;
  }

  // Extracurricular (class/theater/etc.) is too varied for a keyword list —
  // always the generic fallback, parent names it themselves.
  return GENERIC_SUGGESTION;
}

/** Placeholder text for the generic (no keyword match) suggestion input —
 * category-specific so the example format actually matches what's being
 * asked for (a cadence + duration for Sports/Music, no duration for
 * School's daily/weekly homework habit). Only called for categories that
 * reach the generic fallback in the first place (never 'other'). */
export function placeholderForCategory(category: ScheduleEventCategory): string {
  switch (category) {
    case 'sports':
      return 'e.g. Practice soccer, 30 min/day or 2 hrs/week';
    case 'school':
      return 'e.g. Complete homework, daily or weekly';
    case 'music':
      return 'e.g. Practice piano, 20 min/day or 2 hrs/week';
    default:
      return 'e.g. Practice lines for the play';
  }
}
