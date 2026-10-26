// Up/down arrows for nudging a list row one step. Used in Settings → Expected
// Activities and Gigs to set the order of the Today trail.
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  label: string;
}

export function ReorderButtons({ canMoveUp, canMoveDown, onMoveUp, onMoveDown, label }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel={`Move ${label} up`}
        disabled={!canMoveUp}
        hitSlop={6}
        onPress={onMoveUp}
        style={styles.button}
      >
        <Text style={[styles.arrow, !canMoveUp && styles.arrowDisabled]}>▲</Text>
      </Pressable>
      <Pressable
        accessibilityLabel={`Move ${label} down`}
        disabled={!canMoveDown}
        hitSlop={6}
        onPress={onMoveDown}
        style={styles.button}
      >
        <Text style={[styles.arrow, !canMoveDown && styles.arrowDisabled]}>▼</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginRight: 10 },
  button: { width: 34, height: 26, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 15, color: colors.expected },
  arrowDisabled: { color: colors.border },
});
