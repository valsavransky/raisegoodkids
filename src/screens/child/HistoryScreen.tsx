// History: a look back at past weeks for the selected child — milestones, a
// trend chart once there are enough completed weeks, and a card per week.
// Tap a week for its day-by-day detail.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ChildSettingsHeader } from '../../components/ChildSettingsHeader';
import { WeekDots } from '../../components/WeekDots';
import { useAppData } from '../../context/AppDataContext';
import { useHistoryInput } from '../../hooks/useHistory';
import { buildWeeks, buildMilestones, trendWeeks, weekPercent, HistoryWeek } from '../../utils/history';
import { formatShortDate, localDateOf } from '../../utils/date';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

const MILESTONES_SHOWN = 4;

export function weekRangeLabel(week: HistoryWeek): string {
  return week.isCurrent ? 'This week' : `${formatShortDate(week.start)} – ${formatShortDate(week.end)}`;
}

export function HistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { goals, badges, childProfile } = useAppData();
  const input = useHistoryInput();
  const [showAllMilestones, setShowAllMilestones] = useState(false);

  const weeks = buildWeeks(input);
  const trend = trendWeeks(weeks);
  const milestones = buildMilestones(goals, badges);
  const shownMilestones = showAllMilestones ? milestones : milestones.slice(0, MILESTONES_SHOWN);
  const childName = childProfile?.name.trim().split(' ')[0] ?? 'your child';

  return (
    <View style={styles.screen}>
      <ChildSettingsHeader title="History" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
        {weeks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing to look back on yet</Text>
            <Text style={styles.emptyText}>
              Your history will build here as {childName} checks things off over the coming days.
            </Text>
          </View>
        ) : (
          <>
            {trend.length > 0 && (
              <View style={styles.trendCard}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendTitle}>Expected done, recent weeks</Text>
                  <Text style={styles.trendTitle}>
                    avg {Math.round(trend.reduce((sum, t) => sum + t.percent, 0) / trend.length)}%
                  </Text>
                </View>
                <View style={styles.bars}>
                  {trend.map(({ week, percent }) => (
                    <Pressable
                      key={week.start}
                      style={styles.barSlot}
                      onPress={() => navigation.navigate('HistoryWeek', { weekStart: week.start })}
                      accessibilityLabel={`${weekRangeLabel(week)}: ${percent}% done`}
                    >
                      <View
                        style={[
                          styles.bar,
                          { height: `${Math.max(percent, 4)}%` },
                          week.isCurrent && styles.barCurrent,
                        ]}
                      />
                    </Pressable>
                  ))}
                </View>
                <View style={styles.barLabels}>
                  {trend.map(({ week }) => (
                    <Text key={week.start} style={styles.barLabel} numberOfLines={1}>
                      {formatShortDate(week.start).replace(/, \d{4}$/, '')}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {milestones.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Milestones</Text>
                {shownMilestones.map((m) => (
                  <View key={m.id} style={styles.milestone}>
                    <Text style={styles.milestoneIcon}>{m.kind === 'goal' ? '🎯' : '🏅'}</Text>
                    <View style={styles.milestoneText}>
                      <Text style={styles.milestoneTitle}>{m.title}</Text>
                      <Text style={styles.milestoneDate}>
                        {formatShortDate(localDateOf(m.at))}
                        {m.note ? ` · ${m.note}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
                {milestones.length > MILESTONES_SHOWN && (
                  <Pressable onPress={() => setShowAllMilestones((v) => !v)} hitSlop={8}>
                    <Text style={styles.showAll}>
                      {showAllMilestones ? 'Show fewer' : `Show all ${milestones.length}`}
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            <Text style={styles.sectionLabel}>Weeks</Text>
            {weeks.map((week) => {
              const percent = weekPercent(week);
              return (
                <Pressable
                  key={week.start}
                  style={styles.weekCard}
                  onPress={() => navigation.navigate('HistoryWeek', { weekStart: week.start })}
                >
                  <View style={styles.weekTop}>
                    <Text style={styles.weekTitle}>{weekRangeLabel(week)}</Text>
                    <Text style={styles.weekNote}>
                      {week.isCurrent
                        ? 'so far'
                        : week.bestStreak >= 2
                          ? `🔥 best streak ${week.bestStreak}`
                          : week.excusedDays > 0
                            ? `🌴 ${week.excusedDays} day${week.excusedDays === 1 ? '' : 's'} off`
                            : ''}
                    </Text>
                  </View>
                  <WeekDots days={week.days} />
                  <View style={styles.statsRow}>
                    <Text style={styles.stat}>
                      <Text style={styles.statStrong}>
                        {percent === null ? '–' : `${week.expectedDone}/${week.expectedTotal}`}
                      </Text>{' '}
                      Expected
                    </Text>
                    <Text style={styles.stat}>
                      <Text style={styles.statStrong}>{week.gigs}</Text> gig{week.gigs === 1 ? '' : 's'}
                    </Text>
                    {week.goalPercent > 0 && (
                      <Text style={styles.stat}>
                        <Text style={styles.statStrong}>+{week.goalPercent}%</Text> goal
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
            {trend.length === 0 && (
              <Text style={styles.footnote}>A trend chart shows up here after 4 full weeks.</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 20, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  trendCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, backgroundColor: colors.background },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  trendTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 8, marginTop: 12 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: '#9FD8D1' },
  barCurrent: { backgroundColor: colors.expected },
  barLabels: { flexDirection: 'row', gap: 8, marginTop: 6 },
  barLabel: { flex: 1, fontSize: 10, color: colors.textMuted, textAlign: 'center', fontWeight: '600' },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FBEBD6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  milestoneIcon: { fontSize: 20 },
  milestoneText: { flex: 1 },
  milestoneTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  milestoneDate: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  showAll: { fontSize: 13, fontWeight: '700', color: colors.expected, marginTop: 2 },
  weekCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.background,
  },
  weekTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  weekNote: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  stat: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
  statStrong: { fontWeight: '800', color: colors.text },
  footnote: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: 6 },
});
