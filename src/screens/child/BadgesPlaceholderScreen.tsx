// Badge shelf (screen 11) is a later build step — this is a placeholder tab
// so the Home/Badges/Goal bottom nav (screen 2) is complete now.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export function BadgesPlaceholderScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.emoji}>🏅</Text>
      <Text style={styles.text}>Badges are coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 40, marginBottom: 12 },
  text: { fontSize: 15, color: colors.textMuted },
});
