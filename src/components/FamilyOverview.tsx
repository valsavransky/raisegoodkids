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
        const allDone = expected.total > 0 && expected.done === expected.total;
        return (
          <Pressable key={child.id} style={styles.card} onPress={() => selectChild(child.id)}>
            <AvatarGlyph avatarId={child.avatarId} size={40} />
            <View style={styles.info}>
              <Text style={styles.name}>{child.name}</Text>
              <Text style={styles.detail}>
                {excusedToday
                  ? '🌴 Day off today'
                  : expected.total === 0
                    ? 'No Expected activities yet'
                    : `${expected.done} of ${expected.total} Expected done${allDone ? ' ✓' : ''}`}
                {streak > 0 ? ` · ${streak}-day streak` : ''}
              </Text>
              <Text style={styles.goal} numberOfLines={1}>
                {goal ? `🎯 ${goal.name} · ${goal.percent}%` : '🎯 No goal yet'}
              </Text>
            </View>
            <Text style={styles.chevron}>{'›'}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  detail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  goal: { fontSize: 13, color: '#B96A08', fontWeight: '700', marginTop: 3 },
  chevron: { fontSize: 20, color: colors.textMuted },
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
