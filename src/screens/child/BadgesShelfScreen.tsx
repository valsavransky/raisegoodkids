// Screen 11: badge shelf ("Badges" tab). Earned badges show in full color
// with the date; locked ones are grayed out with a lock icon, so there's
// always something visible to work toward next.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppData } from '../../context/AppDataContext';
import { BADGE_CATALOG } from '../../data/badgeCatalog';
import { AppHeader } from '../../components/AppHeader';
import { colors } from '../../theme/colors';

export function BadgesShelfScreen() {
  const { badges } = useAppData();
  const earnedCount = badges.length;
  const remaining = BADGE_CATALOG.length - earnedCount;

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your badges</Text>
        <Text style={styles.subtitle}>
          {earnedCount} earned, {remaining} to go
        </Text>

        <View style={styles.grid}>
          {BADGE_CATALOG.map((entry) => {
            const earned = badges.find((b) => b.catalogId === entry.catalogId);
            return (
              <View key={entry.catalogId} style={styles.tile}>
                <View style={[styles.iconCircle, earned ? { borderColor: entry.color, backgroundColor: colors.surface } : styles.iconCircleLocked]}>
                  <Text style={[styles.icon, !earned && styles.iconLocked]}>{earned ? entry.icon : '🔒'}</Text>
                </View>
                <Text style={[styles.tileTitle, !earned && styles.tileTitleLocked]}>{entry.title}</Text>
                <Text style={styles.tileDate}>
                  {earned ? new Date(earned.earnedAt).toLocaleDateString() : 'Locked'}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: { width: '46%', alignItems: 'center', paddingVertical: 12 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleLocked: { borderColor: colors.border, backgroundColor: colors.surface },
  icon: { fontSize: 28 },
  iconLocked: { opacity: 0.5 },
  tileTitle: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center' },
  tileTitleLocked: { color: colors.textMuted },
  tileDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
