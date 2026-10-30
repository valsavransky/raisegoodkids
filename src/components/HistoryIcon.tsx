// "Look back" icon: a clock with a counter-clockwise arrow. Line style in the
// brand teal, like the rest of the app's icons.
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';

export function HistoryIcon({ size = 18, color = colors.expected }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <Path d="M4 4v4.5h4.5" />
      <Path d="M12 8v4.2l2.8 1.8" />
    </Svg>
  );
}
