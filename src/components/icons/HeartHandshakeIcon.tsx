// Tabler Icons' "heart-handshake" (ti-heart-handshake), MIT licensed —
// https://tabler.io/icons — reproduced as-is (viewBox, stroke, and path
// data unchanged from the source SVG). Expected's category icon per the
// "Icon rule" decision in docs/screens-and-flows.md, replacing the flame
// used during an earlier build phase — always teal, never a stand-in for
// the checkmark (that's reserved for parent-confirmed actions only).
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme/colors';

interface HeartHandshakeIconProps {
  size?: number;
  color?: string;
}

export function HeartHandshakeIcon({ size = 24, color = colors.expected }: HeartHandshakeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
      <Path d="M12 6l-3.293 3.293a1 1 0 0 0 0 1.414l.543 .543c.69 .69 1.81 .69 2.5 0l1 -1a3.182 3.182 0 0 1 4.5 0l2.25 2.25" />
      <Path d="M12.5 15.5l2 2" />
      <Path d="M15 13l2 2" />
    </Svg>
  );
}
