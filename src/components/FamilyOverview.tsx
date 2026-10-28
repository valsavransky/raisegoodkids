// "Everyone" view on Today: each child's day at a glance. Tapping a child opens their own Today.
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../context/AppDataContext';
import { AvatarGlyph } from './AvatarGlyph';
import { colors } from '../theme/colors';

export function FamilyOverview() {
  const insets = useSafeAreaInsets();
  const { childSummaries, selectChild } = useAppData();
  const summaries = childSummaries();
  const gigsToday = summaries.flatMap((s) => s.gigsDoneToday.map((name) => ({ name, who: s.child.name.trim().split(' ')[0] })));

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
      {summaries.map(({ child, expected, streak, goal, excusedToday }) => {
        const expectedPct = expected.total > 0 ? Math.min(100, (expected.done / expected.total) * 100) : 0;
        return (
          <Pressable key={child.id} style={styles.card} onPress={() => selectChild(child.id)}>
            <View style={styles.cardHeader}>
              <AvatarGlyph avatarId={child.avatarId} size={32} />
              <Text style={styles.name} numberOfLines={1}>{child.name}</Text>
              <View style={[styles.pill, streak === 0 && styles.pillMuted]}>
                <Text style={[styles.pillText, streak === 0 && styles.pillTextMuted]}>
                  {streak > 0 ? `🔥 ${streak}-day streak` : 'No streak yet'}
                </Text>
              </View>
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>{excusedToday ? '🌴 Day off today' : 'Expected today'}</Text>
              {!excusedToday && (
                <Text style={styles.label}>{expected.total === 0 ? 'None yet' : `${expected.done} of ${expected.total}`}</Text>
              )}
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${excusedToday ? 0 : expectedPct}%`, backgroundColor: colors.expected }]} />
            </View>

            <View style={styles.labelRow}>
              <Text style={[styles.label, styles.goalLabel]} numberOfLines={1}>
                {goal ? `🎯 ${goal.name}` : '🎯 No goal yet'}
              </Text>
              {goal && <Text style={styles.label}>{goal.percent}%</Text>}
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${goal ? Math.min(100, goal.percent) : 0}%`, backgroundColor: colors.gigs }]} />
            </View>
          </Pressable>
        );
      })}

      <Text style={styles.sectionLabel}>Gigs done today</Text>
      {gigsToday.length === 0 ? (
        <Text style={styles.empty}>No gigs done yet today.</Text>
      ) : (
        <View style={styles.gigList}>
          {gigsToday.map((g, i) => (
            <View key={`${g.who}-${g.name}-${i}`} style={styles.gigRow}>
              <Text style={styles.gigCheck}>✓</Text>
              <Text style={styles.gigName}>{g.name}</Text>
              <Text style={styles.gigWho}>{g.who}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  pill: { backgroundColor: '#FCEBD2', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillMuted: { backgroundColor: colors.surface },
  pillText: { fontSize: 12, fontWeight: '800', color: '#B96A08' },
  pillTextMuted: { color: colors.textMuted },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 5 },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  goalLabel: { flex: 1 },
  track: { height: 7, borderRadius: 4, backgroundColor: '#EEE9DD', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
  },
  empty: { fontSize: 14, color: colors.textMuted },
  gigList: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  gigRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11 },
  gigCheck: { color: colors.gigs, fontWeight: '800' },
  gigName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  gigWho: { fontSize: 13, color: colors.textMuted },
});
