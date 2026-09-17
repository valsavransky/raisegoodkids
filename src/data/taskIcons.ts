// Best-guess icon for a task name, by keyword — same derive-don't-store
// shape as guessGoalCategory/guessCategoryForTitle, so the Today Trail
// (src/screens/child/ChildHomeScreen.tsx) can show a per-task icon without
// adding an `icon` field to ExpectedItem/Gig or threading it through the
// setup wizard. A heuristic v1 pass, tuned against the real chore names in
// contentLibrary.ts — expect some misses on custom parent-typed names,
// same spirit as the avatar illustrations needing a later polish pass.
import { TaskIconName } from '../components/icons/TaskIcons';

const ICON_KEYWORDS: [TaskIconName, string[]][] = [
  ['bed', ['make your bed', 'make my bed']],
  ['toothbrush', ['brush teeth', 'toothbrush']],
  ['shower', ['shower', 'bath']],
  ['backpack', ['backpack', 'shoes by the door']],
  ['homework', ['homework']],
  ['book', ['read for', 'reading', 'book']],
  ['tablet', ['screen time', 'tablet']],
  ['dishes', ['set the table', 'clear your plate', 'clear your place', 'dishwasher', 'dish']],
  ['sponge', ['wipe down', 'counter', 'stovetop', 'sink', 'window', 'dust']],
  ['groceryBag', ['grocery', 'lunch box', 'pantry', 'fridge']],
  ['basket', ['hamper', 'dirty clothes', 'toys away', 'organize a closet', 'organize a shelf']],
  ['foldedClothes', ['fold', 'clean laundry', 'towels', 'get dressed', 'sort a load of laundry', 'sort recycling into the bin']],
  ['broom', ['sweep']],
  ['vacuum', ['vacuum']],
  ['mop', ['mop']],
  ['trash', ['trash', 'wastebasket', 'curb']],
  ['recycle', ['recycling', 'recycle']],
  ['rake', ['rake', 'leaves', 'weed']],
  ['wateringCan', ['water the plant', 'water a houseplant', 'watering']],
  ['bone', ['feed the dog', 'feed the cat', 'feed the pet']],
  ['paw', ['walk the dog', 'walk the cat']],
  ['car', ['car']],
  ['cart', ['carry in', 'groceries']],
  ['mailbox', ['mail']],
];

export function guessTaskIcon(name: string): TaskIconName {
  const lower = name.toLowerCase();
  for (const [icon, keywords] of ICON_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return icon;
  }
  return 'coin';
}
