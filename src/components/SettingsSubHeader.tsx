// Shared header for every screen reached by tapping a Settings row — a
// back arrow (returns to Settings) + centered title, matching the "‹ back,
// title, action" pattern nearly every consumer app's settings uses,
// replacing the plain "Close" text link this app used before (see
// docs/screens-and-flows.md's Known follow-ups — the Settings page was
// flagged as needing a real design pass).
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface SettingsSubHeaderProps {
  title: string;
  onBack: () => void;
}

export function SettingsSubHeader({ title, onBack }: SettingsSubHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.sideSlot}>
        <Text style={styles.backArrow}>{'‹'}</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.sideSlot} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 28,
    paddingBottom: 16,
  },
  sideSlot: { width: 44, alignItems: 'flex-start', paddingLeft: 8 },
  backArrow: { fontSize: 28, color: colors.text },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
});
