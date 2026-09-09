// Suggested Expected items and Gigs, by grade. Transcribed from
// docs/content-library-grade-3-4.md — the only grade slice authored so far
// (3rd & 4th only). Treat these as starting suggestions, not a finished,
// authoritative list — the source doc is explicit that it needs real-family
// testing and revision, and every value here is parent-overridable.
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
    { name: 'Feed the pet', frequency: 'daily' },
    { name: 'Tidy your room', frequency: 'weekly' },
    { name: 'Set the table for dinner', frequency: 'weekly' },
    { name: 'Put away your own clean laundry', frequency: 'weekly' },
  ],
  gigs: [
    { name: 'Water the plants', effortTier: 'quick' },
    { name: 'Empty the wastebaskets around the house', effortTier: 'quick' },
    { name: 'Wipe down kitchen counters and stovetop', effortTier: 'quick' },
    { name: 'Take the trash and recycling bins to the curb', effortTier: 'quick' },
    { name: 'Sweep the porch or garage', effortTier: 'quick' },
    { name: 'Walk the dog', effortTier: 'quick' },
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

const libraries: GradeContentLibrary[] = [grade3And4];

/**
 * Returns the content library matching a grade, or undefined if none has
 * been authored yet. Only 3rd/4th exists in v1 — callers should handle the
 * undefined case (e.g. let the parent start from an empty list).
 */
export function getContentLibraryForGrade(grade: string | undefined): GradeContentLibrary | undefined {
  if (!grade) return undefined;
  return libraries.find((lib) => lib.grades.includes(grade));
}

export const GRADE_OPTIONS = ['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
