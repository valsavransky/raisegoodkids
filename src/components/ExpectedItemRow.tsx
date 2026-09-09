// Self-marked Expected item row. Tapping pops in a green checkmark — see the
// "Icon rule" revision in docs/screens-and-flows.md (originally this state
// used a plain dot, with checkmarks reserved for parent confirmation only;
// the user asked for a checkmark here instead).
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface ExpectedItemRowProps {
  name: string;
  isDone: boolean;
  onPress: () => void;
}

export function ExpectedItemRow({ name, isDone, onPress }: ExpectedItemRowProps) {
  const scale = useRef(new Animated.Value(isDone ? 1 : 0)).current;

  useEffect(() => {
    if (isDone) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }).start();
    } else {
      scale.setValue(0);
    }
  }, [isDone, scale]);

  return (
    <Pressable style={styles.row} disabled={isDone} onPress={onPress}>
      <View style={[styles.circle, isDone && styles.circleDone]}>
        <Animated.Text style={[styles.checkmark, { transform: [{ scale }], opacity: scale }]}>✓</Animated.Text>
      </View>
      <Text style={[styles.name, isDone && styles.nameDone]}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: colors.successBackground, borderColor: colors.success },
  checkmark: { color: colors.success, fontSize: 15, fontWeight: '800' },
  name: { fontSize: 15, color: colors.text, flexShrink: 1 },
  nameDone: { color: colors.textMuted },
});
