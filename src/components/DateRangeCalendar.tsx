// A single month calendar for picking a run of days in one go, the way travel
// sites do: tap the first day, then the last (tap one day twice for a single
// day). Days before minDate can't be picked. Dates are YYYY-MM-DD strings.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { addDays, toLocalDateString } from '../utils/date';
import { colors } from '../theme/colors';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  start: string;
  end: string;
  minDate: string;
  /** Longest run allowed, in days; a tap past it starts a new range instead. */
  maxDays?: number;
  onChange: (start: string, end: string) => void;
}

export function DateRangeCalendar({ start, end, minDate, maxDays = 60, onChange }: Props) {
  const initial = new Date(`${start}T00:00:00`);
  const [year, setYear] = useState(initial.getFullYear());
  const [month, setMonth] = useState(initial.getMonth());
  // After the first tap we're waiting for the last day of the range.
  const [awaitingEnd, setAwaitingEnd] = useState(false);

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = firstOfMonth.getDay();
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toLocalDateString(new Date(year, month, i + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const minMonthStart = new Date(`${minDate}T00:00:00`);
  const canGoBack = year > minMonthStart.getFullYear() || (year === minMonthStart.getFullYear() && month > minMonthStart.getMonth());

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const tap = (date: string) => {
    if (date < minDate) return;
    if (!awaitingEnd) {
      onChange(date, date);
      setAwaitingEnd(true);
      return;
    }
    if (date < start || date > addDays(start, maxDays - 1)) {
      onChange(date, date);
      return;
    }
    onChange(start, date);
    setAwaitingEnd(false);
  };

  return (
    <View>
      <View style={styles.monthRow}>
        <Pressable onPress={() => shiftMonth(-1)} disabled={!canGoBack} hitSlop={10} style={styles.arrow}>
          <Text style={[styles.arrowText, !canGoBack && styles.arrowDisabled]}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={10} style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekday}>{d}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const disabled = date < minDate;
          const isStart = date === start;
          const isEnd = date === end;
          const inRange = date > start && date < end;
          return (
            <Pressable key={i} style={styles.cell} disabled={disabled} onPress={() => tap(date)}>
              <View
                style={[
                  styles.band,
                  (inRange || (isStart && end > start) || (isEnd && end > start)) && styles.bandOn,
                  isStart && end > start && styles.bandStart,
                  isEnd && end > start && styles.bandEnd,
                ]}
              />
              <View style={[styles.dot, (isStart || isEnd) && styles.dotOn]}>
                <Text
                  style={[
                    styles.dayText,
                    disabled && styles.dayDisabled,
                    (isStart || isEnd) && styles.dayOn,
                    date === toLocalDateString(new Date()) && !isStart && !isEnd && styles.dayToday,
                  ]}
                >
                  {Number(date.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  arrow: { width: 36, height: 32, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, color: colors.expected, fontWeight: '700' },
  arrowDisabled: { color: colors.border },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { width: CELL, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, height: 40, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', left: 0, right: 0, top: 5, bottom: 5 },
  bandOn: { backgroundColor: '#D7EFEB' },
  bandStart: { left: '50%' },
  bandEnd: { right: '50%' },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: colors.expected },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.text },
  dayDisabled: { color: colors.border },
  dayOn: { color: '#fff', fontWeight: '800' },
  dayToday: { color: colors.expected, fontWeight: '800' },
});
