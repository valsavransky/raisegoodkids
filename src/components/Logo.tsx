// Merit's logo mark — medal-and-ribbon shape per the brand identity decision
// in docs/vision-doc-kids-goals-app.md: a violet circle with mint/teal
// ribbon tails, and a tone-on-tone "M" monogram (a darker violet fill on
// the lighter violet circle, not a bold contrasting letter) so the medal
// shape reads clearly at small sizes while the monogram still does real
// branding work at larger ones.
import React from 'react';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

const VIOLET = '#AFA9EC';
const VIOLET_DARK = '#6C63B5';
const RIBBON = '#5DCAA5';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M38,58 L28,96 L46,80 L44,58 Z" fill={RIBBON} />
      <Path d="M62,58 L72,96 L54,80 L56,58 Z" fill={RIBBON} />
      <Circle cx={50} cy={40} r={34} fill={VIOLET} />
      <SvgText
        x={50}
        y={53}
        fontSize={38}
        fontWeight="700"
        fill={VIOLET_DARK}
        textAnchor="middle"
      >
        M
      </SvgText>
    </Svg>
  );
}
