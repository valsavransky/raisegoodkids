// Curated starter ideas for "recommended goals" on the Goal tab —
// category-matched against a household's existing goals so a suggestion
// feels chosen, not random. No external product search here (that's a
// separate, vendor-dependent workstream — see docs/screens-and-flows.md);
// these are static, parent-overridable starting points, same spirit as the
// grade content library.
export type GoalCategory = 'toys' | 'games' | 'tech' | 'sports' | 'creative' | 'experience';

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
  { name: 'Board game', category: 'games', typicalCost: 25 },
  { name: 'Video game', category: 'games', typicalCost: 50 },
  { name: 'Card game', category: 'games', typicalCost: 15 },
  { name: 'Tablet', category: 'tech', typicalCost: 150 },
  { name: 'Headphones', category: 'tech', typicalCost: 40 },
  { name: 'Smartwatch', category: 'tech', typicalCost: 80 },
  { name: 'Bicycle', category: 'sports', typicalCost: 150 },
  { name: 'Skateboard', category: 'sports', typicalCost: 70 },
  { name: 'Soccer ball and net', category: 'sports', typicalCost: 40 },
  { name: 'Roller skates', category: 'sports', typicalCost: 50 },
  { name: 'Art supplies set', category: 'creative', typicalCost: 30 },
  { name: 'Craft kit', category: 'creative', typicalCost: 25 },
  { name: 'Musical instrument', category: 'creative', typicalCost: 100 },
  { name: 'Trip to an amusement park', category: 'experience', typicalCost: 100 },
  { name: 'Movie night with friends', category: 'experience', typicalCost: 40 },
  { name: 'Concert or show tickets', category: 'experience', typicalCost: 60 },
];

const CATEGORY_KEYWORDS: Record<GoalCategory, string[]> = {
  toys: ['lego', 'toy', 'figure', 'doll', 'stuffed', 'playset'],
  games: ['game', 'switch', 'xbox', 'playstation', 'nintendo', 'roblox', 'minecraft'],
  tech: ['tablet', 'ipad', 'phone', 'headphone', 'earbuds', 'watch', 'laptop', 'airpods'],
  sports: ['bike', 'bicycle', 'skateboard', 'scooter', 'skates', 'soccer', 'basketball', 'ball', 'cleats'],
  creative: ['art', 'craft', 'paint', 'draw', 'instrument', 'guitar', 'piano', 'keyboard'],
  experience: ['trip', 'ticket', 'concert', 'park', 'movie', 'zoo', 'museum', 'vacation'],
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

/**
 * Suggests up to `limit` goal ideas related to a household's existing
 * goals — category-matched against whichever category appears most often
 * among their current goal names, excluding ideas that duplicate an
 * existing goal name. Returns [] once there's nothing to base a suggestion
 * on (no goals yet, or none of their goal names match a known category).
 */
export function suggestGoalIdeas(existingGoalNames: string[], limit = 3): GoalIdea[] {
  if (existingGoalNames.length === 0) return [];

  const categoryCounts = new Map<GoalCategory, number>();
  for (const name of existingGoalNames) {
    const category = guessGoalCategory(name);
    if (category) categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
  if (categoryCounts.size === 0) return [];

  const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const existingLower = new Set(existingGoalNames.map((n) => n.trim().toLowerCase()));

  return GOAL_IDEAS.filter(
    (idea) => idea.category === topCategory && !existingLower.has(idea.name.toLowerCase())
  ).slice(0, limit);
}
