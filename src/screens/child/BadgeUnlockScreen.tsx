// Screen 1: badge unlock moment (kid-facing). Smaller/lighter than the
// goal-achieved celebration — confetti dots rather than a full burst — per
// docs/screens-and-flows.md ("Bigger and more elaborate than a standard
// gig-completion or badge unlock" is said of the goal-achieved screen,
// implying badge unlocks should read as the lighter-weight moment).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { getBadgeCatalogEntry } from '../../data/badgeCatalog';
import { Confetti } from '../../components/Confetti';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'BadgeUnlock'>;

export function BadgeUnlockScreen({ route, navigation }: Props) {
  const entry = getBadgeCatalogEntry(route.params.catalogId);
  const [confettiTrigger] = useState(1);
  const badgeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [badgeScale]);

  return (
    <View style={styles.screen}>
      <Confetti trigger={confettiTrigger} pieceCount={10} />

      <Animated.View
        style={[styles.badgeCircle, { borderColor: entry?.color ?? colors.expected, transform: [{ scale: badgeScale }] }]}
      >
        <Text style={styles.badgeIcon}>{entry?.icon ?? '🏅'}</Text>
      </Animated.View>

      <Text style={styles.title}>{entry?.title ?? 'Badge earned'}</Text>
      <Text style={styles.subtitle}>{entry?.subtitle ?? 'Nice work!'}</Text>

      <Pressable style={styles.continueButton} onPress={() => navigation.goBack()}>
        <Text style={styles.continueButtonText}>Nice!</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  badgeCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: 20,
  },
  badgeIcon: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  continueButton: {
    marginTop: 32,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
