// Trekker logo + wordmark, laid out exactly like the Welcome screen's brand row
// (same size, gap and type) so the mark stays in the same spot as a parent
// moves from Welcome to Sign in. Static — Welcome layers its own idle
// "breathing" animation on its copy of this row.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Logo } from './Logo';
import { colors } from '../theme/colors';

export function BrandHeader() {
  return (
    <View style={styles.brandRow}>
      <Logo size={64} />
      <Text style={styles.wordmark}>Trekker</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  wordmark: { fontSize: 28, fontWeight: '700', color: colors.text },
});
