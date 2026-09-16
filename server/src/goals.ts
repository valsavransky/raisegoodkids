import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, AuthedRequest } from './auth';

export const goalsRouter = Router();

const GOAL_CATEGORIES = ['toys', 'games', 'tech', 'sports', 'creative', 'experience'] as const;

// Absent (rather than a thrown startup error) when ANTHROPIC_API_KEY isn't
// set — Tier 1 classification is an enhancement, not something the goal-add
// flow depends on, so the route below just no-ops to { category: null }.
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

goalsRouter.post('/classify-category', requireAuth, async (req: AuthedRequest, res) => {
  const name = String(req.body?.name ?? '').trim();
  if (!name || !anthropic) {
    res.json({ category: null });
    return;
  }
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 30,
      messages: [
        {
          role: 'user',
          content: `A kid wants to save up for "${name}". Which single category best fits it: toys, games, tech, sports, creative, experience? Reply with just the category word, or "none" if nothing fits well.`,
        },
      ],
    });
    const text = message.content.find((block) => block.type === 'text')?.text.trim().toLowerCase() ?? '';
    const category = GOAL_CATEGORIES.find((c) => c === text) ?? null;
    res.json({ category });
  } catch (err) {
    console.warn('Goal category classification failed', err);
    res.json({ category: null });
  }
});
