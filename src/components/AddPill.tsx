// The app's one "add something" button: a small filled pill, "+ Add" (or
// "+ Add child" where no screen title says what's being added). Lives in the
// top bar of each list screen so it's always visible. Teal for Expected and
// schedule items, amber for gigs and goals, matching the app's category colors.
import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface AddPillProps {
  onPress: () => void;
  label?: string;
  color?: string;
}

export function AddPill({ onPress, label = 'Add', color = colors.expected }: AddPillProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.pill, { backgroundColor: color }]}
    >
      <Text style={styles.text}>+ {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  text: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
