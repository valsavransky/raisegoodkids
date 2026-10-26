// Excused days: a sick day, a trip, a holiday or the child's birthday make the
// "excusable" Expected activities optional for that day, and keep the streak
// from breaking. Each activity says once, in Settings, whether it can be
// excused (see ExpectedItem.excusable).
import { ExpectedItem } from '../types/models';

/** Personal-care items stay required by default; everything else can be
 * excused. A parent can flip either way per activity. */
const ALWAYS_REQUIRED_PATTERN = /teeth|tooth|brush|bath|shower|hygiene|medic|vitamin/i;

export function isItemExcusable(item: Pick<ExpectedItem, 'name' | 'excusable'>): boolean {
  return item.excusable ?? !ALWAYS_REQUIRED_PATTERN.test(item.name);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** True when dateStr (YYYY-MM-DD) falls on the child's birthday (YYYY-MM-DD).
 * A Feb 29 birthday is celebrated on Feb 28 in years without one. */
export function isBirthdayOn(birthday: string | undefined, dateStr: string): boolean {
  if (!birthday || birthday.length < 10) return false;
  const [, bm, bd] = birthday.split('-').map(Number);
  const [y, m, d] = dateStr.split('-').map(Number);
  if (![bm, bd, y, m, d].every(Number.isFinite)) return false;
  if (bm === 2 && bd === 29 && !isLeapYear(y)) return m === 2 && d === 28;
  return bm === m && bd === d;
}

/** The child's age on dateStr, or null if the birthday is missing or unusable. */
export function ageOn(birthday: string | undefined, dateStr: string): number | null {
  if (!birthday || birthday.length < 10) return null;
  const [by, bm, bd] = birthday.split('-').map(Number);
  const [y, m, d] = dateStr.split('-').map(Number);
  if (![by, bm, bd, y, m, d].every(Number.isFinite)) return null;
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age >= 0 ? age : null;
}

/** 1st, 2nd, 3rd, 4th, 11th, 12th, 21st… */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export interface ExcuseRange {
  start: string;
  end: string;
  reason?: string;
  dates: string[];
}

/** Groups excused days into runs of consecutive dates sharing one reason,
 * for the Excused days list ("Nov 11 – Nov 15"). */
export function groupExcuseRanges(
  excuses: { date: string; reason?: string }[],
  addDays: (d: string, n: number) => string
): ExcuseRange[] {
  const sorted = [...excuses].sort((a, b) => a.date.localeCompare(b.date));
  const ranges: ExcuseRange[] = [];
  for (const e of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && last.reason === e.reason && addDays(last.end, 1) === e.date) {
      last.end = e.date;
      last.dates.push(e.date);
    } else {
      ranges.push({ start: e.date, end: e.date, reason: e.reason, dates: [e.date] });
    }
  }
  return ranges;
}

/** The next time the child's birthday falls on or after dateStr, as YYYY-MM-DD. */
export function nextBirthdayOnOrAfter(birthday: string | undefined, dateStr: string): string | null {
  if (!birthday || birthday.length < 10) return null;
  const [, bm, bd] = birthday.split('-').map(Number);
  const year = Number(dateStr.slice(0, 4));
  if (![bm, bd, year].every(Number.isFinite)) return null;
  for (const y of [year, year + 1]) {
    const day = bm === 2 && bd === 29 && !isLeapYear(y) ? 28 : bd;
    const candidate = `${y}-${String(bm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (candidate >= dateStr) return candidate;
  }
  return null;
}
