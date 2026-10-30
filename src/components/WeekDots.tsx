// Seven small blocks for a week (Sunday to Saturday), one per day, coloured by
// how much of that day's Expected list got done.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HistoryDay, HistoryDayState } from '../utils/history';
import { colors } from '../theme/colors';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const FILL: Record<HistoryDayState, { bg: string; fg: string }> = {
  complete: { bg: colors.expected, fg: '#FFFFFF' },
  partial: { bg: '#9FD8D1', fg: '#0B6D63' },
  excused: { bg: '#FCEBD2', fg: '#B96A08' },
  none: { bg: '#EEE9DD', fg: '#8a8578' },
  future: { bg: '#F4F1E8', fg: '#BDB7A6' },
  before: { bg: '#F4F1E8', fg: '#BDB7A6' },
};

export function WeekDots({ days }: { days: HistoryDay[] }) {
  return (
    <View style={styles.row}>
      {days.map((day, i) => (
        <View key={day.date} style={[styles.dot, { backgroundColor: FILL[day.state].bg }]}>
          <Text style={[styles.letter, { color: FILL[day.state].fg }]}>{LETTERS[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginTop: 10 },
  dot: { flex: 1, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 11, fontWeight: '800' },
});
