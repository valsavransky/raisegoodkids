// Gig row for the child home screen. Mirrors ExpectedItemRow's leading
// circle-tap affordance (coin → checkmark, amber to match the Gigs category
// color) so a gig reads as tappable/available, with the goal-progress
// percentage demoted to a caption rather than the dominant element — per
// user feedback that the percentage alone read as a stat, not an action.
//
// A small "+X%" floats up and fades on the exact tap that completes it —
// a lightweight in-place celebration, not a takeover screen, per the user's
// request for something smaller than the badge/goal celebrations.
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface GigItemRowProps {
  name: string;
  percentage: number | null;
  isDone: boolean;
  onPress: () => void;
}

export function GigItemRow({ name, percentage, isDone, onPress }: GigItemRowProps) {
  const scale = useRef(new Animated.Value(isDone ? 1 : 0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const wasDone = useRef(isDone);

  useEffect(() => {
    const justCompleted = isDone && !wasDone.current;
    wasDone.current = isDone;

    if (isDone) {
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
    } else {
      scale.setValue(0);
    }

    if (justCompleted) {
      floatAnim.setValue(0);
      Animated.timing(floatAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }
  }, [isDone, scale, floatAnim]);

  const floatTranslateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -26] });
  const floatOpacity = floatAnim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });

  return (
    <Pressable style={styles.row} disabled={isDone} onPress={onPress}>
      <View style={styles.circleWrapper}>
        <View style={[styles.circle, isDone && styles.circleDone]}>
          {isDone ? (
            <Animated.Text style={[styles.checkmark, { transform: [{ scale }], opacity: scale }]}>✓</Animated.Text>
          ) : (
            <Text style={styles.coin}>🪙</Text>
          )}
        </View>
        <Animated.Text
          pointerEvents="none"
          style={[styles.floatText, { opacity: floatOpacity, transform: [{ translateY: floatTranslateY }] }]}
        >
          +{percentage}%
        </Animated.Text>
      </View>
      <View style={styles.textColumn}>
        <Text style={[styles.name, isDone && styles.nameDone]}>{name}</Text>
        <Text style={styles.caption}>{isDone ? 'Done — counted toward your goal' : `Worth +${percentage}% toward your goal`}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  circleWrapper: { width: 32, height: 32 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gigs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: colors.gigs, borderColor: colors.gigs },
  coin: { fontSize: 15 },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: '800' },
  floatText: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: colors.gigs,
  },
  textColumn: { flexShrink: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  nameDone: { color: colors.textMuted },
  caption: { fontSize: 12, color: colors.gigs, fontWeight: '600', marginTop: 2 },
});
