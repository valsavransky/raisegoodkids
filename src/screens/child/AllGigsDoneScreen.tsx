// Big celebration for clearing every available Gig in a single day — mirrors
// AllExpectedDoneScreen's shape (confetti, animated icon, optional badge
// callout, single "Awesome!" dismiss) but themed amber/Gigs instead of teal,
// and with an added "recommend more gigs" section: since the kid just ran
// out of paid work to do, this is the moment to nudge the parent toward
// adding more before they're stuck with nothing to earn from until tomorrow.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { getBadgeCatalogEntry } from '../../data/badgeCatalog';
import { suggestMoreGigs, SuggestedGig } from '../../data/contentLibrary';
import { Confetti } from '../../components/Confetti';
import { BadgeIconGlyph } from '../../components/BadgeIconGlyph';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AllGigsDone'>;

export function AllGigsDoneScreen({ route, navigation }: Props) {
  const { childProfile, gigs, addGig } = useAppData();
  const badge = route.params.badgeCatalogId ? getBadgeCatalogEntry(route.params.badgeCatalogId) : undefined;

  const [confettiTrigger] = useState(1);
  const [addedNames, setAddedNames] = useState<string[]>([]);
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(iconRotate, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(iconRotate, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true }),
      ]),
    ]).start();
  }, [iconScale, iconRotate]);

  const suggestions = suggestMoreGigs(
    childProfile ?? {},
    [...gigs.map((g) => g.name), ...addedNames],
    3
  );

  const addSuggestion = (idea: SuggestedGig) => {
    addGig({ name: idea.name, effortTier: idea.effortTier });
    setAddedNames((prev) => [...prev, idea.name]);
  };

  const spin = iconRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-12deg'] });

  return (
    <View style={styles.screen}>
      <Confetti trigger={confettiTrigger} pieceCount={30} />

      <Animated.View style={{ transform: [{ scale: iconScale }, { rotate: spin }], marginBottom: 12 }}>
        <Text style={styles.icon}>🪙</Text>
      </Animated.View>

      <Text style={styles.title}>All gigs done today!</Text>
      <Text style={styles.subtitle}>Every gig cleared — that's real progress toward the goal.</Text>

      {badge && (
        <View style={styles.badgeCallout}>
          <BadgeIconGlyph icon={badge.icon} size={20} color={badge.color} textStyle={styles.badgeCalloutIcon} />
          <Text style={styles.badgeCalloutText}>Plus: {badge.title} badge!</Text>
        </View>
      )}

      {suggestions.length > 0 && (
        <View style={styles.suggestSection}>
          <Text style={styles.suggestHeading}>Out of gigs? Add a few more</Text>
          {suggestions.map((idea) => {
            const added = addedNames.includes(idea.name);
            return (
              <View key={idea.name} style={styles.suggestRow}>
                <Text style={styles.suggestName}>{idea.name}</Text>
                {added ? (
                  <Text style={styles.suggestAddedText}>✓ Added</Text>
                ) : (
                  <Pressable style={styles.suggestAddButton} onPress={() => addSuggestion(idea)}>
                    <Text style={styles.suggestAddButtonText}>+ Add</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
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
  icon: { fontSize: 64 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.gigs, fontWeight: '700', marginTop: 8, textAlign: 'center' },
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
  suggestSection: {
    width: '100%',
    marginTop: 28,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  suggestHeading: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 10 },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  suggestName: { fontSize: 14, color: colors.text, flexShrink: 1, marginRight: 12 },
  suggestAddButton: {
    borderWidth: 1,
    borderColor: colors.gigs,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  suggestAddButtonText: { color: colors.gigs, fontSize: 13, fontWeight: '700' },
  suggestAddedText: { color: colors.success, fontSize: 13, fontWeight: '700' },
  continueButton: {
    marginTop: 32,
    backgroundColor: colors.gigs,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
