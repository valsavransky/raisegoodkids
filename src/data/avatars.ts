// Shared avatar options — used by the profile picker at setup and by every
// screen that renders a child's chosen avatar. Illustrated characters per
// the "Avatar picker (revised)" decision in docs/screens-and-flows.md,
// replacing the earlier plain animal-emoji set — see AvatarIcons.tsx for
// the actual SVG components and the design-formula note.
import { ComponentType } from 'react';
import {
  BlobMonsterAvatar,
  NarwhalAvatar,
  CactusAvatar,
  CloudAvatar,
  DonutAvatar,
} from '../components/icons/AvatarIcons';

export interface AvatarOption {
  id: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'avatar-1', label: 'Blob monster', Icon: BlobMonsterAvatar },
  { id: 'avatar-2', label: 'Narwhal', Icon: NarwhalAvatar },
  { id: 'avatar-3', label: 'Cactus', Icon: CactusAvatar },
  { id: 'avatar-4', label: 'Cloud', Icon: CloudAvatar },
  { id: 'avatar-5', label: 'Donut', Icon: DonutAvatar },
];

const DEFAULT_AVATAR = AVATAR_OPTIONS[0].Icon;

/** Falls back to the first character rather than rendering nothing — an
 * unrecognized/missing avatarId (old data, a future added-then-removed
 * option) should never leave a blank circle where a face belongs. */
export function getAvatarIcon(avatarId: string | undefined): ComponentType<{ size?: number }> {
  return AVATAR_OPTIONS.find((a) => a.id === avatarId)?.Icon ?? DEFAULT_AVATAR;
}

/** Each avatar's main color and a light tint of it, so a child's card on the approval
 * screen can echo their avatar and be told apart from a sibling's at a glance. */
const AVATAR_COLORS: Record<string, { main: string; tint: string }> = {
  'avatar-1': { main: '#E8890C', tint: '#FCEBD2' },
  'avatar-2': { main: '#0F9B8E', tint: '#E1F3F0' },
  'avatar-3': { main: '#6C63B5', tint: '#ECEAF8' },
  'avatar-4': { main: '#D6568F', tint: '#FBE6EF' },
  'avatar-5': { main: '#B97A33', tint: '#F5E8D6' },
};

export function getAvatarColors(avatarId: string | undefined): { main: string; tint: string } {
  return AVATAR_COLORS[avatarId ?? ''] ?? AVATAR_COLORS['avatar-1'];
}
