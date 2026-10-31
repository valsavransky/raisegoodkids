// "Everyone" (the whole family): two people, drawn as a teal line icon like the
// History icon, so it sits comfortably next to the children's avatars.
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

export function EveryoneIcon({ size = 18, color = colors.expected }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={9} cy={8.5} r={3.2} />
      <Path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <Circle cx={17} cy={9.5} r={2.5} />
      <Path d="M16.5 14.2c3 0 5 1.8 5 4.6" />
    </Svg>
  );
}
