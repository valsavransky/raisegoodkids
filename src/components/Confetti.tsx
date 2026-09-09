// Falling/rotating confetti burst. Reused across celebratory moments —
// goal-achieved (screen 12) today, badge unlocks (screen 1) later, per
// docs/screens-and-flows.md's badge/achievement motif.
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../theme/colors';

const DEFAULT_COLORS = [colors.expected, colors.gigs, colors.futureFund, colors.character];

interface ConfettiProps {
  /** Increment this to replay the burst (e.g. on "Play the fanfare" tap). */
  trigger: number;
  pieceCount?: number;
}

interface Piece {
  left: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotationDeg: number;
}

export function Confetti({ trigger, pieceCount = 18 }: ConfettiProps) {
  const { width } = useWindowDimensions();
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: pieceCount }, () => ({
        left: Math.random() * width,
        color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        size: 6 + Math.random() * 6,
        delay: Math.random() * 200,
        duration: 900 + Math.random() * 500,
        drift: (Math.random() - 0.5) * 80,
        rotationDeg: 180 + Math.random() * 360,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger, pieceCount, width]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece, index) => (
        <ConfettiPiece key={`${trigger}-${index}`} piece={piece} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [piece, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-20, 320] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.rotationDeg}deg`] });
  const opacity = progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: piece.left,
        top: 0,
        width: piece.size,
        height: piece.size * 1.6,
        backgroundColor: piece.color,
        borderRadius: 2,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}
