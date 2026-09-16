// Illustrated character avatars, per the "Avatar picker (revised)" decision
// in docs/screens-and-flows.md — replaces the earlier plain animal-emoji
// set with 5 whimsical characters that share one design formula (two dot
// eyes + an expressive mouth), so a later addition (a cupcake, a robot)
// automatically feels part of the same family. Hand-coded as flat SVG
// primitives for a fast first pass, same known limitation the design doc
// calls out — a proper illustrator's pass is worth doing before these get
// stared at daily, but these are a real step up from a generic emoji set.
import React from 'react';
import Svg, { Circle, Path, Line } from 'react-native-svg';

interface AvatarIconProps {
  size?: number;
}

export function BlobMonsterAvatar({ size = 40 }: AvatarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M50 14 C 72 14 86 30 88 52 C 90 72 74 90 50 90 C 26 90 10 72 12 52 C 14 30 28 14 50 14 Z"
        fill="#E8890C"
      />
      <Circle cx={34} cy={46} r={11} fill="#fff" />
      <Circle cx={27} cy={47} r={5} fill="#2A2018" />
      <Circle cx={68} cy={44} r={9} fill="#fff" />
      <Circle cx={73} cy={43} r={4} fill="#2A2018" />
      <Path d="M32 66 Q50 82 70 62 Q68 78 50 80 Q34 79 32 66 Z" fill="#3A2A18" />
      <Path d="M44 68 Q50 82 58 66 Q54 76 50 76 Q46 76 44 68 Z" fill="#E8607A" />
    </Svg>
  );
}

export function NarwhalAvatar({ size = 40 }: AvatarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 6 L58 34 L42 34 Z" fill="#0F9B8E" />
      <Line x1={46} y1={14} x2={54} y2={14} stroke="#0C7E73" strokeWidth={2} />
      <Line x1={44.5} y1={21} x2={55.5} y2={21} stroke="#0C7E73" strokeWidth={2} />
      <Line x1={43} y1={28} x2={57} y2={28} stroke="#0C7E73" strokeWidth={2} />
      <Circle cx={50} cy={60} r={35} fill="#17B3A3" />
      <Path d="M8 58 Q -6 60 4 74 Q 16 76 20 62 Z" fill="#17B3A3" />
      <Path d="M32 52 q6 -6 12 0" stroke="#0C7E73" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Circle cx={66} cy={52} r={8} fill="#fff" />
      <Circle cx={68} cy={52} r={3.6} fill="#0C3B36" />
      <Path d="M40 72 Q50 86 62 70 Q58 82 50 82 Q42 82 40 72 Z" fill="#0C3B36" />
      <Path d="M46 74 Q50 84 55 72 Q52 79 50 79 Q47 79 46 74 Z" fill="#E8607A" />
    </Svg>
  );
}

export function CactusAvatar({ size = 40 }: AvatarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M34 18 h32 a16 16 0 0 1 16 16 v34 a16 16 0 0 1 -16 16 h-32 a16 16 0 0 1 -16 -16 v-34 a16 16 0 0 1 16 -16 Z"
        fill="#8B7FE8"
      />
      <Path d="M34 40 Q14 40 14 56 Q14 66 24 66 Q30 66 30 58 L30 40 Z" fill="#8B7FE8" />
      <Path d="M66 30 Q86 30 86 46 Q86 56 76 56 Q70 56 70 48 L70 30 Z" fill="#8B7FE8" />
      <Circle cx={42} cy={46} r={7} fill="#2E2350" />
      <Circle cx={58} cy={46} r={7} fill="#2E2350" />
      <Circle cx={44.5} cy={46} r={2.4} fill="#fff" />
      <Circle cx={55.5} cy={46} r={2.4} fill="#fff" />
      <Path d="M38 64 Q50 74 62 64" stroke="#2E2350" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Path d="M47 65 L51 73 L55 65 Z" fill="#fff" />
      <Line x1={40} y1={24} x2={40} y2={30} stroke="#6C63B5" strokeWidth={2} strokeLinecap="round" />
      <Line x1={50} y1={20} x2={50} y2={26} stroke="#6C63B5" strokeWidth={2} strokeLinecap="round" />
      <Line x1={60} y1={24} x2={60} y2={30} stroke="#6C63B5" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CloudAvatar({ size = 40 }: AvatarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M26 62 A16 16 0 1 1 30 30 A20 20 0 0 1 68 24 A18 18 0 0 1 86 50 A16 16 0 0 1 82 62 Z"
        fill="#E874C0"
      />
      <Path d="M32 56 q6 -6 12 0" stroke="#8A1064" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <Circle cx={62} cy={52} r={7.5} fill="#fff" />
      <Circle cx={64} cy={52} r={3.2} fill="#5C0A40" />
      <Circle cx={24} cy={62} r={7} fill="#FF6FA5" />
      <Circle cx={76} cy={62} r={7} fill="#FF6FA5" />
      <Path d="M38 68 Q50 82 62 68 Q58 80 50 80 Q42 80 38 68 Z" fill="#5C0A40" />
      <Path d="M44 70 Q50 80 56 68 Q53 76 50 76 Q47 76 44 70 Z" fill="#FF8FAE" />
    </Svg>
  );
}

export function DonutAvatar({ size = 40 }: AvatarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        fillRule="evenodd"
        d="M50 12 A38 38 0 1 1 49.9 12 Z M50 34 A16 16 0 1 0 50.1 34 Z"
        fill="#D2934F"
      />
      <Path d="M18 42 A32 20 0 0 1 82 42 A34 22 0 0 1 50 58 A34 22 0 0 1 18 42 Z" fill="#F2B6D0" />
      <Circle cx={30} cy={34} r={3} fill="#7C4DFF" />
      <Circle cx={44} cy={28} r={3} fill="#0F9B8E" />
      <Circle cx={58} cy={32} r={3} fill="#E8890C" />
      <Circle cx={68} cy={40} r={3} fill="#D6249F" />
      <Circle cx={38} cy={40} r={3} fill="#0F9B8E" />
      <Circle cx={61} cy={64} r={8.5} fill="#fff" />
      <Circle cx={59} cy={68} r={3.6} fill="#2A2018" />
      <Circle cx={39} cy={64} r={8.5} fill="#fff" />
      <Circle cx={42} cy={60} r={3.6} fill="#2A2018" />
      <Path d="M40 78 Q50 90 60 78 Q56 88 50 88 Q44 88 40 78 Z" fill="#3A2A18" />
      <Path d="M46 79 Q50 87 55 78 Q52 84 50 84 Q47 84 46 79 Z" fill="#E8607A" />
    </Svg>
  );
}
