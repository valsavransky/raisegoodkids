// One past week in detail: totals, a day-by-day grid of each daily Expected
// activity and each gig done, and any goal or badge earned that week.
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ChildSettingsHeader } from '../../components/ChildSettingsHeader';
import { useAppData } from '../../context/AppDataContext';
import { useHistoryInput } from '../../hooks/useHistory';
import { buildWeeks, buildWeekDetail, buildMilestones, HistoryCell } from '../../utils/history';
import { formatShortDate, localDateOf } from '../../utils/date';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'HistoryWeek'>;

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CELL_COLOR: Record<HistoryCell, string> = {
  done: colors.expected,
  excused: '#FCEBD2',
  none: '#EEE9DD',
  future: '#F4F1E8',
  before: '#F4F1E8',
};

export function HistoryWeekScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { gigs, goals, badges } = useAppData();
  const input = useHistoryInput();
  const week = buildWeeks(input).find((w) => w.start === route.params.weekStart);

  if (!week) {
    return (
      <View style={styles.screen}>
        <ChildSettingsHeader title="Week" onBack={() => navigation.goBack()} />
        <Text style={styles.missing}>That week isn't available.</Text>
      </View>
    );
  }

  const detail = buildWeekDetail(week, input, gigs);
  const earned = buildMilestones(goals, badges).filter((m) => {
    const d = localDateOf(m.at);
    return d >= week.start && d <= week.end;
  });
  const title = week.isCurrent ? 'This week' : `${formatShortDate(week.start)} – ${formatShortDate(week.end)}`;

  const header = (
    <View style={styles.gridRow}>
      <View style={styles.nameCol} />
      {LETTERS.map((l, i) => (
        <Text key={i} style={styles.dayLetter}>{l}</Text>
      ))}
    </View>
  );

  return (
    <View style={styles.screen}>
      <ChildSettingsHeader title={title} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileValue}>{week.expectedTotal > 0 ? `${week.expectedDone}/${week.expectedTotal}` : '–'}</Text>
            <Text style={styles.tileLabel}>Expected</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileValue}>{week.gigs}</Text>
            <Text style={styles.tileLabel}>Gigs</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileValue}>{week.goalPercent > 0 ? `+${week.goalPercent}%` : '–'}</Text>
            <Text style={styles.tileLabel}>Goal</Text>
          </View>
        </View>

        {detail.expectedRows.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Expected activities</Text>
            {header}
            {detail.expectedRows.map((row) => (
              <View key={row.id} style={styles.gridRow}>
                <Text style={styles.nameCol} numberOfLines={2}>{row.name}</Text>
                {row.cells.map((cell, i) => (
                  <View key={i} style={[styles.cell, { backgroundColor: CELL_COLOR[cell] }]} />
                ))}
              </View>
            ))}
          </>
        )}

        {detail.gigRows.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Gigs</Text>
            {header}
            {detail.gigRows.map((row) => (
              <View key={row.id} style={styles.gridRow}>
                <Text style={styles.nameCol} numberOfLines={2}>{row.name}</Text>
                {row.cells.map((done, i) => (
                  <View key={i} style={[styles.cell, { backgroundColor: done ? colors.gigs : '#EEE9DD' }]} />
                ))}
              </View>
            ))}
          </>
        )}

        {earned.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Earned this week</Text>
            {earned.map((m) => (
              <View key={m.id} style={styles.milestone}>
                <Text style={styles.milestoneIcon}>{m.kind === 'goal' ? '🎯' : '🏅'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneTitle}>{m.title}</Text>
                  <Text style={styles.milestoneDate}>{formatShortDate(localDateOf(m.at))}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {week.excusedDays > 0 && (
          <Text style={styles.footnote}>🌴 {week.excusedDays} day{week.excusedDays === 1 ? '' : 's'} off didn't count against the week.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  missing: { textAlign: 'center', color: colors.textMuted, marginTop: 60 },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.background },
  tileValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  tileLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 8,
  },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  nameCol: { width: 104, fontSize: 12.5, fontWeight: '600', color: colors.text },
  dayLetter: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: colors.textMuted },
  cell: { flex: 1, height: 22, borderRadius: 6 },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FBEBD6', borderRadius: 12, padding: 12, marginBottom: 8 },
  milestoneIcon: { fontSize: 20 },
  milestoneTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  milestoneDate: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  footnote: { fontSize: 12.5, color: colors.textMuted, marginTop: 18 },
});
