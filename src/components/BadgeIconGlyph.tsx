// Renders a BadgeCatalogEntry's icon, which is almost always a plain emoji
// string (the app's established icon language everywhere else) but can be
// a real vector component for the rare case an emoji can't represent the
// decided icon (see HeartHandshakeIcon) — one lookup, used by every screen
// that shows a badge icon, so that's a decision made once, not per screen.
import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { BadgeIcon } from '../data/badgeCatalog';

interface BadgeIconGlyphProps {
  icon: BadgeIcon;
  size: number;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
}

export function BadgeIconGlyph({ icon, size, color, textStyle }: BadgeIconGlyphProps) {
  if (typeof icon === 'string') {
    return <Text style={textStyle}>{icon}</Text>;
  }
  const IconComponent = icon;
  return <IconComponent size={size} color={color} />;
}
