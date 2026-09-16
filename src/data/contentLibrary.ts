// Suggested Expected items and Gigs, by grade. Transcribed from
// docs/content-library-grade-3-4.md and docs/content-library-grade-k-2.md —
// the only two grade bands authored so far. Treat these as starting
// suggestions, not a finished, authoritative list — the source docs are
// explicit that they need real-family testing and revision, and every value
// here is parent-overridable.
//
// Feeding/walking a pet are NOT listed here on purpose — they're added
// dynamically by ExpectedSetupScreen/GigsSetupScreen instead (personalized
// with the pet's name, and correctly gated on hasPet/petType), so don't
// re-add a generic "Feed the pet"/"Walk the dog" line here — it would
// suggest itself to every family regardless of whether they have a pet,
// which is exactly the bug this comment is here to prevent recurring.
import { GigEffortTier } from '../types/models';

export interface SuggestedExpectedItem {
  name: string;
  frequency: 'daily' | 'weekly';
}

export interface SuggestedGig {
  name: string;
  effortTier: GigEffortTier;
  /** Depends on a household feature not every family has (a yard, a car). */
  ifApplicable?: 'yard' | 'car';
}

export interface GradeContentLibrary {
  grades: string[];
  expectedItems: SuggestedExpectedItem[];
  gigs: SuggestedGig[];
}

const grade3And4: GradeContentLibrary = {
  grades: ['3rd', '4th'],
  expectedItems: [
    { name: 'Make your bed', frequency: 'daily' },
    { name: 'Brush teeth, morning and night', frequency: 'daily' },
    { name: 'Pack your own backpack for school', frequency: 'daily' },
    { name: 'Homework before screen time', frequency: 'daily' },
    { name: 'Read for 20 minutes', frequency: 'daily' },
    { name: 'Put dirty clothes in the hamper', frequency: 'daily' },
    { name: 'Clear your place and load into dishwasher after meals', frequency: 'daily' },
    { name: 'Set the table for dinner', frequency: 'daily' },
    { name: 'Tidy your room', frequency: 'weekly' },
    { name: 'Put away your own clean laundry', frequency: 'weekly' },
  ],
  gigs: [
    { name: 'Water the plants', effortTier: 'quick' },
    { name: 'Empty the wastebaskets around the house', effortTier: 'quick' },
    { name: 'Wipe down kitchen counters and stovetop', effortTier: 'quick' },
    { name: 'Take the trash and recycling bins to the curb', effortTier: 'quick' },
    { name: 'Sweep the porch or garage', effortTier: 'quick', ifApplicable: 'yard' },
    { name: 'Vacuum a room', effortTier: 'medium' },
    { name: 'Vacuum and wipe down the inside of the car', effortTier: 'medium', ifApplicable: 'car' },
    { name: 'Wash the car exterior (helping, not solo)', effortTier: 'medium', ifApplicable: 'car' },
    { name: 'Clean out and organize the fridge (toss expired items)', effortTier: 'medium' },
    { name: 'Organize a closet, shelf, or pantry', effortTier: 'medium' },
    { name: 'Fold and put away a full load of family laundry', effortTier: 'medium' },
    { name: 'Rake leaves', effortTier: 'medium', ifApplicable: 'yard' },
    { name: 'Help prepare a simple family meal', effortTier: 'medium' },
    { name: 'Wash the dishes by hand (a full load)', effortTier: 'big_job' },
    { name: 'Deep-clean a bathroom (sink, toilet exterior, mirror, floor)', effortTier: 'big_job' },
    { name: 'Weed a garden bed', effortTier: 'big_job', ifApplicable: 'yard' },
    { name: 'Wash the windows (reachable ones only)', effortTier: 'big_job' },
    { name: 'Sort and start a load of laundry', effortTier: 'big_job' },
  ],
};

// K-2nd skews toward "with help"/supervised framing rather than fully
// independent versions of the same tasks (see docs/content-library-grade-k-2.md)
// — a 5-7 year old's realistic independence is a different shape than 3rd/4th's,
// not just an easier version of it. No big_job gigs on purpose: nothing here
// should require unsupervised heavy lifting or sharp/hot tools at this age.
const gradeKTo2: GradeContentLibrary = {
  grades: ['K', '1st', '2nd'],
  expectedItems: [
    { name: 'Get dressed by yourself', frequency: 'daily' },
    { name: 'Brush teeth, morning and night', frequency: 'daily' },
    { name: 'Make your bed (with help)', frequency: 'daily' },
    { name: 'Put toys away before bed', frequency: 'daily' },
    { name: 'Put dirty clothes in the hamper', frequency: 'daily' },
    { name: 'Clear your plate after meals', frequency: 'daily' },
    { name: 'Put backpack and shoes by the door', frequency: 'daily' },
    { name: 'Help set the table for dinner', frequency: 'daily' },
    { name: 'Tidy your room with a grown-up', frequency: 'weekly' },
    { name: 'Put away your own clean laundry (socks and folded shirts)', frequency: 'weekly' },
  ],
  gigs: [
    { name: 'Water a houseplant', effortTier: 'quick' },
    { name: 'Match socks from the laundry', effortTier: 'quick' },
    { name: 'Wipe down the bathroom sink', effortTier: 'quick' },
    { name: 'Put away the silverware from the dishwasher (no knives)', effortTier: 'quick' },
    { name: 'Dust low shelves and furniture', effortTier: 'quick' },
    { name: 'Sort recycling into the bin', effortTier: 'quick' },
    { name: 'Help pack their lunch box', effortTier: 'quick' },
    { name: 'Help fold and put away towels', effortTier: 'medium' },
    { name: 'Help unload the dishwasher (plastic and unbreakable items only)', effortTier: 'medium' },
    { name: 'Help carry in light grocery bags', effortTier: 'medium' },
    { name: 'Rake a small pile of leaves', effortTier: 'medium', ifApplicable: 'yard' },
    { name: 'Help wash the car with a sponge (supervised)', effortTier: 'medium', ifApplicable: 'car' },
    { name: 'Sort a load of laundry into lights and darks', effortTier: 'medium' },
  ],
};

const libraries: GradeContentLibrary[] = [gradeKTo2, grade3And4];

/**
 * Returns the content library matching a grade, or undefined if none has
 * been authored yet. Only K-2nd and 3rd/4th exist so far — callers should
 * handle the undefined case (e.g. let the parent start from an empty list).
 */
export function getContentLibraryForGrade(grade: string | undefined): GradeContentLibrary | undefined {
  if (!grade) return undefined;
  return libraries.find((lib) => lib.grades.includes(grade));
}

export const GRADE_OPTIONS = ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
