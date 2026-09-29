// Small helpers for the setup wizard's child-personalized copy.

/** First word of the child's name, or a neutral stand-in before one exists. */
export function childFirstName(name: string | undefined): string {
  return name?.trim().split(/\s+/)[0] || 'your child';
}

/** "Rayna's" — possessive form of the child's first name. */
export function childPossessive(name: string | undefined): string {
  const first = childFirstName(name);
  return first.endsWith('s') ? `${first}'` : `${first}'s`;
}

/** "a 3rd grader", "an 8th grader", "a kindergartner" — for GRADE_OPTIONS values. */
export function gradeLabel(grade: string): string {
  if (grade === 'K') return 'a kindergartner';
  return `${grade === '8th' ? 'an' : 'a'} ${grade} grader`;
}
