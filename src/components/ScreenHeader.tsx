// Shared header for the parent setup wizard: back arrow + title + step
// indicator. Parent-facing voice is calm and efficient — no exclamation
// points (see docs/screens-and-flows.md, "Dual voice").
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface ScreenHeaderProps {
  title: string;
  step: number;
  totalSteps: number;
  onBack?: () => void;
}

export function ScreenHeader({ title, step, totalSteps, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} disabled={!onBack} hitSlop={12} style={styles.backButton}>
          <Text style={[styles.backArrow, !onBack && styles.backArrowHidden]}>{'←'}</Text>
        </Pressable>
        <Text style={styles.stepIndicator}>
          Step {step} of {totalSteps}
        </Text>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 32,
  },
  backArrow: {
    fontSize: 20,
    color: colors.text,
  },
  backArrowHidden: {
    opacity: 0,
  },
  stepIndicator: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
});
