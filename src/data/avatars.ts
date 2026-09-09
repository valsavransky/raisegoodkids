// Shared avatar options — used by the profile picker at setup and by the
// header everywhere else that needs to render a child's chosen avatar.
export const AVATAR_OPTIONS = [
  { id: 'avatar-1', emoji: '🦊' },
  { id: 'avatar-2', emoji: '🐱' },
  { id: 'avatar-3', emoji: '🐼' },
  { id: 'avatar-4', emoji: '🐸' },
  { id: 'avatar-5', emoji: '🦁' },
];

export const AVATAR_EMOJI: Record<string, string> = Object.fromEntries(
  AVATAR_OPTIONS.map((a) => [a.id, a.emoji])
);
