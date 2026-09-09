// Big celebration for finishing every Expected item in a single day — not
// part of the original screen spec, added on request. Teal-themed (the
// Expected category color) rather than reusing the Gigs/goal amber, so it
// reads as its own kind of win. A streak-threshold badge earned on the same
// day (it always coincides, since a streak day only counts when everything
// was done) is folded into this screen instead of also popping its own
// BadgeUnlock modal — it still shows here, just without a second takeover.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { getBadgeCatalogEntry } from '../../data/badgeCatalog';
import { Confetti } from '../../components/Confetti';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AllExpectedDone'>;

export function AllExpectedDoneScreen({ route, navigation }: Props) {
  const { expectedStreak } = useAppData();
  const badge = route.params.badgeCatalogId ? getBadgeCatalogEntry(route.params.badgeCatalogId) : undefined;
  const streak = expectedStreak();

  const [confettiTrigger] = useState(1);
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [iconScale]);

  return (
    <View style={styles.screen}>
      <Confetti trigger={confettiTrigger} pieceCount={22} />

      <Animated.Text style={[styles.icon, { transform: [{ scale: iconScale }] }]}>🔥</Animated.Text>

      <Text style={styles.title}>All done today!</Text>
      <Text style={styles.subtitle}>
        {streak}-day streak{streak === 1 ? '' : ' and counting'}
      </Text>

      {badge && (
        <View style={styles.badgeCallout}>
          <Text style={styles.badgeCalloutIcon}>{badge.icon}</Text>
          <Text style={styles.badgeCalloutText}>Plus: {badge.title} badge!</Text>
        </View>
      )}

      <Pressable style={styles.continueButton} onPress={() => navigation.goBack()}>
        <Text style={styles.continueButtonText}>Awesome!</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 72, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.expected, fontWeight: '700', marginTop: 8 },
  badgeCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  badgeCalloutIcon: { fontSize: 20 },
  badgeCalloutText: { fontSize: 14, fontWeight: '700', color: colors.text },
  continueButton: {
    marginTop: 32,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
