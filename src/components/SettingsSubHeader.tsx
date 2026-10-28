// Shared header for every screen reached by tapping a Settings row — a
// back arrow (returns to Settings) + centered title, matching the "‹ back,
// title, action" pattern nearly every consumer app's settings uses,
// replacing the plain "Close" text link this app used before (see
// docs/screens-and-flows.md's Known follow-ups — the Settings page was
// flagged as needing a real design pass).
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface SettingsSubHeaderProps {
  title: string;
  onBack: () => void;
  /** An "+ Add" pill on the right, for list screens (see AddPill). */
  action?: React.ReactNode;
}

export function SettingsSubHeader({ title, onBack, action }: SettingsSubHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.sideSlot}>
        <Text style={styles.backArrow}>{'‹'}</Text>
      </Pressable>
      {/* A long title (say a child's name added) shrinks to leave room for the pill. */}
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{title}</Text>
      <View style={styles.actionSlot}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  sideSlot: { width: 44, alignItems: 'flex-start', paddingLeft: 8 },
  backArrow: { fontSize: 28, color: colors.text },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center', marginHorizontal: 6 },
  actionSlot: { minWidth: 44, alignItems: 'flex-end', paddingRight: 8 },
});
