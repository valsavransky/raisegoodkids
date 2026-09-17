// Curated starter ideas for "recommended goals" on the Goal tab —
// category-matched against a household's existing goals so a suggestion
// feels chosen, not random. No external product search here (that's a
// separate, vendor-dependent workstream — see docs/screens-and-flows.md);
// these are static, parent-overridable starting points, same spirit as the
// grade content library.
import { GoalCategory } from '../types/models';

export type { GoalCategory };

export interface GoalIdea {
  name: string;
  category: GoalCategory;
  typicalCost: number;
}

export const GOAL_IDEAS: GoalIdea[] = [
  { name: 'Lego set', category: 'toys', typicalCost: 40 },
  { name: 'Building blocks set', category: 'toys', typicalCost: 35 },
  { name: 'Action figure', category: 'toys', typicalCost: 20 },
  { name: 'Stuffed animal', category: 'toys', typicalCost: 20 },
  { name: 'Remote control car', category: 'toys', typicalCost: 45 },
  { name: 'Dollhouse', category: 'toys', typicalCost: 60 },
  { name: '500-piece puzzle', category: 'toys', typicalCost: 20 },
  { name: 'Collectible trading cards', category: 'toys', typicalCost: 15 },

  { name: 'Board game', category: 'games', typicalCost: 25 },
  { name: 'Video game', category: 'games', typicalCost: 50 },
  { name: 'Card game', category: 'games', typicalCost: 15 },
  { name: 'Handheld gaming device', category: 'games', typicalCost: 90 },
  { name: 'Chess or strategy game set', category: 'games', typicalCost: 30 },
  { name: 'Family game night bundle', category: 'games', typicalCost: 45 },

  { name: 'Tablet', category: 'tech', typicalCost: 150 },
  { name: 'Headphones', category: 'tech', typicalCost: 40 },
  { name: 'Smartwatch', category: 'tech', typicalCost: 80 },
  { name: "Kids' camera", category: 'tech', typicalCost: 50 },
  { name: 'Bluetooth speaker', category: 'tech', typicalCost: 35 },
  { name: 'E-reader', category: 'tech', typicalCost: 100 },

  { name: 'Bicycle', category: 'sports', typicalCost: 150 },
  { name: 'Skateboard', category: 'sports', typicalCost: 70 },
  { name: 'Soccer ball and net', category: 'sports', typicalCost: 40 },
  { name: 'Roller skates', category: 'sports', typicalCost: 50 },
  { name: 'Scooter', category: 'sports', typicalCost: 60 },
  { name: 'Basketball hoop', category: 'sports', typicalCost: 90 },
  { name: 'Swim gear and goggles set', category: 'sports', typicalCost: 25 },

  { name: 'Art supplies set', category: 'creative', typicalCost: 30 },
  { name: 'Craft kit', category: 'creative', typicalCost: 25 },
  { name: 'Musical instrument', category: 'creative', typicalCost: 100 },
  { name: 'Drawing tablet', category: 'creative', typicalCost: 60 },
  { name: 'Jewelry-making kit', category: 'creative', typicalCost: 25 },
  { name: 'Science experiment kit', category: 'creative', typicalCost: 30 },

  { name: 'Trip to an amusement park', category: 'experience', typicalCost: 100 },
  { name: 'Movie night with friends', category: 'experience', typicalCost: 40 },
  { name: 'Concert or show tickets', category: 'experience', typicalCost: 60 },
  { name: 'Zoo or aquarium membership', category: 'experience', typicalCost: 80 },
  { name: 'Weekend camping trip', category: 'experience', typicalCost: 120 },
  { name: 'Cooking class', category: 'experience', typicalCost: 50 },
];

export const CATEGORY_EMOJI: Record<GoalCategory, string> = {
  toys: '🧸',
  games: '🎮',
  tech: '📱',
  sports: '⚽',
  creative: '🎨',
  experience: '🎡',
};

const CATEGORY_ORDER = Object.keys(CATEGORY_EMOJI) as GoalCategory[];

const CATEGORY_KEYWORDS: Record<GoalCategory, string[]> = {
  toys: ['lego', 'toy', 'figure', 'doll', 'stuffed', 'playset', 'puzzle', 'trading card'],
  games: ['game', 'switch', 'xbox', 'playstation', 'nintendo', 'roblox', 'minecraft', 'chess'],
  tech: ['tablet', 'ipad', 'phone', 'headphone', 'earbuds', 'watch', 'laptop', 'airpods', 'camera', 'speaker'],
  sports: ['bike', 'bicycle', 'skateboard', 'scooter', 'skates', 'soccer', 'basketball', 'ball', 'cleats'],
  creative: ['art', 'craft', 'paint', 'draw', 'instrument', 'guitar', 'piano', 'keyboard', 'science kit'],
  experience: ['trip', 'ticket', 'concert', 'park', 'movie', 'zoo', 'museum', 'vacation', 'camping', 'cooking class'],
};

/** Best-guess category for a goal name, by keyword — same shape as
 * guessCategoryForTitle in practiceSuggestions.ts. Returns undefined rather
 * than a generic fallback when nothing matches, since a wrong guess here
 * would surface an irrelevant suggestion rather than just skip one. */
export function guessGoalCategory(name: string): GoalCategory | undefined {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [GoalCategory, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return undefined;
}

// Deterministic PRNG (mulberry32) so a given seed always shuffles the same
// way within a render pass, but different seeds (e.g. across days) produce
// a different order — gives suggestions variety over time without any
// persisted state or a jarring reshuffle on every re-render.
function seededShuffle<T>(items: T[], seed: number): T[] {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function hashString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
  return hash;
}

/** Changes once a day — rotates which suggestions surface (so it's not
 * always the literal first N items in GOAL_IDEAS) while staying stable
 * across re-renders within the same day, so the list doesn't visibly
 * reshuffle every time a kid checks something off. */
function daySeed(): number {
  return Math.floor(Date.now() / 86_400_000);
}

/**
 * Suggests up to `limit` goal ideas related to a household's existing
 * goals. With no goals yet, returns a spread across different categories
 * (one idea each) so the Goal tab has something to look at on a brand-new
 * profile instead of an empty "Suggested for you" section.
 *
 * Once there's at least one goal, category-matches against the *most
 * recently added* goal first (so adding a goal visibly changes what's
 * suggested next, not just a slow-moving aggregate a single new goal might
 * not shift) — falling back to whichever category appears most often
 * overall if the latest goal's category can't be determined (e.g. a name
 * that missed both keyword match and Claude classification).
 *
 * Prefers each goal's stored `category` (set at add-time — see
 * AppDataContext.addGoal — by keyword match, or by asking Claude when
 * keywords miss; see server/src/goals.ts) and only falls back to
 * re-guessing from the name for older goals saved before that field
 * existed. Never repeats an existing goal name, and rotates which items
 * within a category surface (see daySeed) so it's not always the same
 * three every time.
 */
export function suggestGoalIdeas(existingGoals: { name: string; category?: GoalCategory }[], limit = 3): GoalIdea[] {
  const existingLower = new Set(existingGoals.map((g) => g.name.trim().toLowerCase()));
  const notAlreadyAdded = (idea: GoalIdea) => !existingLower.has(idea.name.toLowerCase());
  const seed = daySeed();

  if (existingGoals.length === 0) {
    const categories = seededShuffle(CATEGORY_ORDER, seed);
    const picks: GoalIdea[] = [];
    for (const category of categories) {
      if (picks.length >= limit) break;
      const options = seededShuffle(
        GOAL_IDEAS.filter((idea) => idea.category === category && notAlreadyAdded(idea)),
        seed + hashString(category)
      );
      if (options[0]) picks.push(options[0]);
    }
    return picks;
  }

  const lastGoal = existingGoals[existingGoals.length - 1];
  let topCategory = lastGoal.category ?? guessGoalCategory(lastGoal.name);

  if (!topCategory) {
    const categoryCounts = new Map<GoalCategory, number>();
    for (const goal of existingGoals) {
      const category = goal.category ?? guessGoalCategory(goal.name);
      if (category) categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
    if (categoryCounts.size > 0) {
      topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
  }
  if (!topCategory) return [];

  const matching = GOAL_IDEAS.filter((idea) => idea.category === topCategory && notAlreadyAdded(idea));
  return seededShuffle(matching, seed + hashString(topCategory)).slice(0, limit);
}
