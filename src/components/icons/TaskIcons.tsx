// Task icon library for the Today Trail — simple stroke icons for Expected
// and Gigs tasks, 24x24, round caps/joins, no fill, single `color` prop so
// the same icon works on a teal (Expected) or amber (Gigs) node.
import React from 'react';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const defaults = (props: IconProps) => ({
  size: props.size ?? 24,
  color: props.color ?? '#FFFFFF',
  strokeWidth: props.strokeWidth ?? 2,
});

// ---------- Hygiene ----------

export function BedIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="11" width="20" height="8" rx="2" />
      <Path d="M2 15V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
      <Path d="M14 11V8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
    </Svg>
  );
}

export function ToothbrushIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 20 L12 12" />
      <Path d="M11.5 7.5 L17 2 L20.5 5.5 L15 11 Z" />
      <Path d="M13.2 5.8 L16.2 2.8" />
      <Path d="M15.2 7.8 L18.2 4.8" />
    </Svg>
  );
}

export function ShowerIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 9 a7 7 0 0 1 14 0" />
      <Line x1="3" y1="9" x2="21" y2="9" />
      <Line x1="7" y1="13" x2="7" y2="13.5" />
      <Line x1="12" y1="13" x2="12" y2="13.5" />
      <Line x1="17" y1="13" x2="17" y2="13.5" />
      <Line x1="7" y1="17" x2="7" y2="17.5" />
      <Line x1="12" y1="17" x2="12" y2="17.5" />
      <Line x1="17" y1="17" x2="17" y2="17.5" />
      <Line x1="7" y1="21" x2="7" y2="21.5" />
      <Line x1="12" y1="21" x2="12" y2="21.5" />
      <Line x1="17" y1="21" x2="17" y2="21.5" />
    </Svg>
  );
}

// ---------- Bedroom & Laundry ----------

export function BackpackIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="5" y="8" width="14" height="13" rx="3" />
      <Path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <Rect x="10" y="12" width="4" height="3" rx="1" />
    </Svg>
  );
}

export function LaundryBasketIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 10 L6 20 Q6 21 7 21 L17 21 Q18 21 18 20 L20 10 Z" />
      <Line x1="4" y1="10" x2="20" y2="10" />
      <Line x1="8" y1="10" x2="8" y2="21" />
      <Line x1="16" y1="10" x2="16" y2="21" />
      <Path d="M9 10 V6 Q9 4 12 4 Q15 4 15 6 V10" />
    </Svg>
  );
}

export function FoldedClothesIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="5" width="18" height="5" rx="1.5" />
      <Rect x="3" y="12" width="18" height="5" rx="1.5" />
      <Path d="M3 20 h18" />
    </Svg>
  );
}

// ---------- Kitchen & Dining ----------

export function DishesIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Circle cx="12" cy="12" r="4" />
    </Svg>
  );
}

export function SpongeIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="8" width="18" height="10" rx="3" />
      <Line x1="7" y1="12" x2="9" y2="12" />
      <Line x1="12" y1="12" x2="14" y2="12" />
      <Line x1="17" y1="12" x2="19" y2="12" />
      <Path d="M3 16 q9 4 18 0" />
    </Svg>
  );
}

export function GroceryBagIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 8 L6 21 h12 L19 8 Z" />
      <Path d="M9 8 V6 a3 3 0 0 1 6 0 v2" />
    </Svg>
  );
}

// ---------- Cleaning ----------

export function BroomIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 3 L8 15" />
      <Path d="M8 15 L4 21 h12 l-2 -6 z" />
    </Svg>
  );
}

export function VacuumIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="8" y="3" width="4" height="11" rx="1.5" />
      <Path d="M10 14 L6 21" />
      <Path d="M6 21 a6 3 0 0 0 10 0" />
      <Circle cx="14.5" cy="8.5" r="1.5" />
    </Svg>
  );
}

export function MopIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 3 L9 17" />
      <Path d="M9 17 q-3 1 -4 4 q4 1 6 -1 q2 -2 -2 -3 z" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 7 h14 l-1 13 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2 z" />
      <Line x1="3" y1="7" x2="21" y2="7" />
      <Line x1="9" y1="4" x2="15" y2="4" />
      <Line x1="10" y1="11" x2="10" y2="16" />
      <Line x1="14" y1="11" x2="14" y2="16" />
    </Svg>
  );
}

export function RecycleBinIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 8 h12 l-1 12 a2 2 0 0 1 -2 2 H9 a2 2 0 0 1 -2 -2 Z" />
      <Line x1="4" y1="8" x2="20" y2="8" />
      <Line x1="9" y1="5" x2="15" y2="5" />
      <Line x1="9" y1="5" x2="9" y2="8" />
      <Line x1="15" y1="5" x2="15" y2="8" />
    </Svg>
  );
}

// ---------- School & Screens ----------

export function HomeworkIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="5" y="4" width="12" height="16" rx="1.5" />
      <Line x1="8" y1="9" x2="14" y2="9" />
      <Line x1="8" y1="13" x2="14" y2="13" />
      <Path d="M15 15 L20 20 L17 21 L16 18 Z" />
    </Svg>
  );
}

export function BookIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 6 c3 -2 6 -2 8 0 v12 c-2 -2 -5 -2 -8 0 z" />
      <Path d="M20 6 c-3 -2 -6 -2 -8 0 v12 c2 -2 5 -2 8 0 z" />
    </Svg>
  );
}

export function TabletIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="5" y="3" width="14" height="18" rx="2" />
      <Line x1="11" y1="18" x2="13" y2="18" />
    </Svg>
  );
}

// ---------- Outdoor & Yard ----------

export function RakeIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 3 L7 17" />
      <Path d="M4 17 h10" />
      <Line x1="5" y1="17" x2="4" y2="21" />
      <Line x1="8" y1="17" x2="7.5" y2="21" />
      <Line x1="11" y1="17" x2="11" y2="21" />
      <Line x1="14" y1="17" x2="14.5" y2="21" />
    </Svg>
  );
}

export function WateringCanIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12 h10 a3 3 0 0 1 3 3 v1 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2 -2 Z" />
      <Path d="M14 12 L20 8" />
      <Path d="M17 6 L21 6 M19 4 L19 8" />
      <Line x1="7" y1="12" x2="7" y2="9" />
    </Svg>
  );
}

// ---------- Pets ----------

export function BoneIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="5" cy="7" r="2.3" />
      <Circle cx="5" cy="12" r="2.3" />
      <Circle cx="19" cy="12" r="2.3" />
      <Circle cx="19" cy="17" r="2.3" />
      <Line x1="7" y1="9.3" x2="17" y2="14.7" strokeWidth={strokeWidth * 2.25} />
    </Svg>
  );
}

export function PawIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="8" cy="8" r="2" />
      <Circle cx="13" cy="6.5" r="2" />
      <Circle cx="17.5" cy="9.5" r="2" />
      <Path d="M6 18 a5 5 0 0 1 11 0 a3 3 0 0 1 -5.5 1.7 a3 3 0 0 1 -5.5 -1.7 z" />
    </Svg>
  );
}

// ---------- Errands & Gigs ----------

export function CarIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 16 L5 10 Q6 8 9 8 L15 8 Q18 8 19 10 L20 16 Z" />
      <Circle cx="8" cy="17" r="2" />
      <Circle cx="16" cy="17" r="2" />
    </Svg>
  );
}

export function MailboxIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12 a5 5 0 0 1 5 -5 h9 v10 H8 a5 5 0 0 1 -5 -5 z" />
      <Line x1="17" y1="7" x2="17" y2="17" />
      <Line x1="6" y1="10" x2="8" y2="10" />
      <Line x1="10" y1="20" x2="10" y2="22" />
      <Line x1="6" y1="20" x2="6" y2="22" />
    </Svg>
  );
}

export function CartIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 4 h2 l2.4 12.2 a2 2 0 0 0 2 1.8 h7.7 a2 2 0 0 0 2 -1.6 L21 8 H6" />
      <Circle cx="9.5" cy="20" r="1.4" />
      <Circle cx="17" cy="20" r="1.4" />
    </Svg>
  );
}

export function CoinIcon(props: IconProps) {
  const { size, color, strokeWidth } = defaults(props);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Path d="M9.5 9 a2.5 2 0 0 1 5 0 M9.5 15 a2.5 2 0 0 0 5 0" />
      <Line x1="12" y1="7" x2="12" y2="17" />
    </Svg>
  );
}

// ---------- Lookup + picker map ----------

export const TASK_ICONS = {
  bed: BedIcon,
  toothbrush: ToothbrushIcon,
  shower: ShowerIcon,
  backpack: BackpackIcon,
  basket: LaundryBasketIcon,
  foldedClothes: FoldedClothesIcon,
  dishes: DishesIcon,
  sponge: SpongeIcon,
  groceryBag: GroceryBagIcon,
  broom: BroomIcon,
  vacuum: VacuumIcon,
  mop: MopIcon,
  trash: TrashIcon,
  recycle: RecycleBinIcon,
  homework: HomeworkIcon,
  book: BookIcon,
  tablet: TabletIcon,
  rake: RakeIcon,
  wateringCan: WateringCanIcon,
  bone: BoneIcon,
  paw: PawIcon,
  car: CarIcon,
  mailbox: MailboxIcon,
  cart: CartIcon,
  coin: CoinIcon,
} as const;

export type TaskIconName = keyof typeof TASK_ICONS;

/** Renders any icon by name — falls back to the coin icon if the name isn't found. */
export function TaskIcon({ name, ...rest }: IconProps & { name: string }) {
  const Icon = TASK_ICONS[name as TaskIconName] ?? CoinIcon;
  return <Icon {...rest} />;
}
