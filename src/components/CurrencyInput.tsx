// A dollar-amount text field with a fixed "$" in front, so money fields read
// as money everywhere (goal cost, Future Fund contributions, gig values).
// Keeps only digits and one decimal point, with at most two decimal places.
// `compact` is the narrow right-aligned version used in lists of amounts.
import React from 'react';
import { View, Text, TextInput, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function sanitizeAmount(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2);
}

export function CurrencyInput({ value, onChangeText, placeholder, compact, style }: Props) {
  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : styles.wrapFull, style]}>
      <Text style={[styles.symbol, compact && styles.symbolCompact]}>$</Text>
      <TextInput
        style={[styles.input, compact ? styles.inputCompact : styles.inputFull]}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={(text) => onChangeText(sanitizeAmount(text))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  wrapFull: { borderRadius: 10, paddingHorizontal: 14, marginBottom: 12 },
  wrapCompact: { borderRadius: 10, paddingHorizontal: 10, backgroundColor: colors.surface },
  symbol: { fontSize: 16, fontWeight: '700', color: colors.textMuted, marginRight: 8 },
  symbolCompact: { fontSize: 15, marginRight: 4 },
  input: { color: colors.text },
  inputFull: { flex: 1, fontSize: 16, paddingVertical: 12 },
  inputCompact: { fontSize: 15, paddingVertical: 8, width: 56, textAlign: 'right' },
});
