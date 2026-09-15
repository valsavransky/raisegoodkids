// Shared header for the parent setup wizard: back arrow + brand mark + a
// visual step-progress bar (replacing "Step X of Y" text — reads at a
// glance) + a tappable child-profile chip once a name exists (jumps back
// to the Child Profile step to review/edit it) + title. Parent-facing
// voice is calm and efficient — no exclamation points (see
// docs/screens-and-flows.md, "Dual voice").
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Logo } from './Logo';
import { AVATAR_EMOJI } from '../data/avatars';
import { colors } from '../theme/colors';

interface ScreenHeaderProps {
  title: string;
  step: number;
  totalSteps: number;
  onBack?: () => void;
  /** Shown as a small tappable chip (avatar + first name) once the
   * child's name has been entered — omitted on the Child Profile step
   * itself, since you're already there editing it. */
  childName?: string;
  childAvatarId?: string;
  onPressProfile?: () => void;
  /** Extra breathing room above the title, beyond the default 12px — for a
   * step whose content starts sparse (e.g. just two fields), so the title
   * doesn't feel cramped up against the progress bar. */
  titleMarginTop?: number;
}

export function ScreenHeader({
  title,
  step,
  totalSteps,
  onBack,
  childName,
  childAvatarId,
  onPressProfile,
  titleMarginTop,
}: ScreenHeaderProps) {
  const firstName = childName?.trim().split(' ')[0];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} disabled={!onBack} hitSlop={12} style={styles.sideSlot}>
          <Text style={[styles.backArrow, !onBack && styles.backArrowHidden]}>{'←'}</Text>
        </Pressable>

        <View style={styles.brandRow}>
          {/* Swap the mark by changing this import — nothing else in the
           * header depends on it being the medal-and-ribbon Logo. */}
          <Logo size={28} />
          <Text style={styles.wordmark}>Merit</Text>
        </View>

        {firstName ? (
          <Pressable onPress={onPressProfile} hitSlop={8} style={styles.profileChip}>
            <Text style={styles.profileAvatar}>{AVATAR_EMOJI[childAvatarId ?? ''] ?? '🙂'}</Text>
            <Text style={styles.profileName}>{firstName}</Text>
          </Pressable>
        ) : (
          <View style={styles.sideSlot} />
        )}
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={[styles.progressSegment, i < step && styles.progressSegmentFilled]} />
        ))}
      </View>

      <Text style={[styles.title, titleMarginTop != null && { marginTop: titleMarginTop }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideSlot: {
    width: 32,
  },
  backArrow: {
    fontSize: 20,
    color: colors.text,
  },
  backArrowHidden: {
    opacity: 0,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  wordmark: { fontSize: 19, fontWeight: '700', color: colors.text },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  profileAvatar: { fontSize: 14 },
  profileName: { fontSize: 12, fontWeight: '600', color: colors.text },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 16, marginBottom: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressSegmentFilled: { backgroundColor: colors.expected },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
});
