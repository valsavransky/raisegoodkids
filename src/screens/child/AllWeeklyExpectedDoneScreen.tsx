// Weekly counterpart to AllExpectedDoneScreen — fires when every active
// weekly Expected item (e.g. "Tidy your room") is done for the current
// week, instead of getting folded into the daily "all done today"
// celebration (see AppDataContext.markExpectedDone's allWeeklyDoneThisWeek —
// a weekly item completing the weekly set is a different accomplishment
// than a daily item completing today's set, so it gets its own moment
// rather than re-showing the daily streak screen for the wrong reason).
// No streak language here — weekly items don't have a day-to-day streak.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { getBadgeCatalogEntry } from '../../data/badgeCatalog';
import { playSound } from '../../services/sound';
import { Confetti } from '../../components/Confetti';
import { BadgeIconGlyph } from '../../components/BadgeIconGlyph';
import { HeartHandshakeIcon } from '../../components/icons/HeartHandshakeIcon';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AllWeeklyExpectedDone'>;

export function AllWeeklyExpectedDoneScreen({ route, navigation }: Props) {
  const { soundEnabled } = useAppData();
  const badge = route.params.badgeCatalogId ? getBadgeCatalogEntry(route.params.badgeCatalogId) : undefined;

  const [confettiTrigger] = useState(1);
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    if (badge) playSound('badgeUnlock', soundEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iconScale]);

  return (
    <View style={styles.screen}>
      <Confetti trigger={confettiTrigger} pieceCount={22} />

      <Animated.View style={{ transform: [{ scale: iconScale }], marginBottom: 12 }}>
        <HeartHandshakeIcon size={72} />
      </Animated.View>

      <Text style={styles.title}>Weekly tasks: done!</Text>
      <Text style={styles.subtitle}>Great job wrapping up this week's Expected tasks!</Text>

      {badge && (
        <View style={styles.badgeCallout}>
          <BadgeIconGlyph icon={badge.icon} size={20} color={badge.color} textStyle={styles.badgeCalloutIcon} />
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
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.expected, fontWeight: '700', marginTop: 8, textAlign: 'center' },
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
