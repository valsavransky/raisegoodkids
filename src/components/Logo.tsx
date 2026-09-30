// UpTrek's logo mark (renamed from "Merit", Sept 30 2026) — three nested,
// organic arches rising to a summit, abstracted just far enough that it
// reads as a peak or a roofline depending how you look at it, rather than
// a literal mountain. A thin winding trail climbs through all three layers
// to a small marker at the top. Violet + mint, carried over from the
// original brand palette. Replaces the earlier medal-and-ribbon "M"
// monogram, which was built specifically around the "Merit" name and
// doesn't carry over to a journey-based name.
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const VIOLET = '#6F63D9';
const MINT = '#5DCAA5';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Smallest foothill arch (front) */}
      <Path
        d="M70,172 Q85,155 100,145 Q115,155 130,172"
        stroke={MINT}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      {/* Middle foothill arch */}
      <Path
        d="M56,162 Q78,130 100,113 Q122,130 144,162"
        stroke={MINT}
        strokeWidth={9}
        strokeLinecap="round"
        opacity={0.55}
        fill="none"
      />
      {/* Main peak arch (the summit) */}
      <Path
        d="M38,150 Q68,100 100,62 Q132,100 162,150"
        stroke={VIOLET}
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Winding trail climbing through the peak */}
      <Path
        d="M58,145 C72,120 68,98 88,82 C99,73 97,63 106,52"
        stroke={MINT}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="1,12"
        fill="none"
      />
      {/* Summit marker */}
      <Circle cx={100} cy={62} r={6} fill="#FFFFFF" stroke={VIOLET} strokeWidth={3} />
    </Svg>
  );
}
