// Renders a child's chosen avatar by id — same "look up the component, one
// place" pattern as BadgeIconGlyph, so every screen that shows an avatar
// (setup picker, header chip, settings profile row) draws from the same
// source instead of each re-implementing the id → icon lookup.
import React from 'react';
import { getAvatarIcon } from '../data/avatars';

interface AvatarGlyphProps {
  avatarId?: string;
  size?: number;
}

export function AvatarGlyph({ avatarId, size = 32 }: AvatarGlyphProps) {
  const Icon = getAvatarIcon(avatarId);
  return <Icon size={size} />;
}
