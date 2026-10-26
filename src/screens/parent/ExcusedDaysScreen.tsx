// Settings → Excused days. A day (or a run of days, like a trip) when the
// Expected activities marked "can be excused" are optional and the streak is
// kept. The child's birthday is excused automatically and listed here for
// reference. Today's one-tap version lives on the Today screen.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Alert, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { EXCUSE_REASON_LABELS } from '../../components/ExcuseTodaySheet';
import { useAppData } from '../../context/AppDataContext';
import { DailyExcuseReason } from '../../types/models';
import { addDays, formatShortDate, todayString, toLocalDateString } from '../../utils/date';
import { groupExcuseRanges, nextBirthdayOnOrAfter } from '../../utils/excuse';
import { colors } from '../../theme/colors';
import { LINK_HIT_SLOP } from '../../theme/hitSlop';

type Props = NativeStackScreenProps<RootStackParamList, 'ExcusedDaysSettings'>;

const MAX_RANGE_DAYS = 60;

function dateOf(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function ExcusedDaysScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { childProfile, dailyExcuses, excuseDays, removeExcuseDays } = useAppData();
  const today = todayString();

  const [adding, setAdding] = useState(false);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [reason, setReason] = useState<DailyExcuseReason | undefined>(undefined);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  useEffect(() => {
    if (route.params?.openAdd) openAdd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcoming = groupExcuseRanges(
    dailyExcuses.filter((e) => e.date >= today),
    addDays
  );
  const nextBirthday = nextBirthdayOnOrAfter(childProfile?.birthday, today);
  const name = childProfile?.name?.trim().split(/\s+/)[0] ?? 'your child';

  const openAdd = () => {
    setStart(today);
    setEnd(today);
    setReason(undefined);
    setAdding(true);
  };

  const openPicker = (target: 'start' | 'end') => {
    setTempDate(dateOf(target === 'start' ? start : end));
    setPickerTarget(target);
  };

  const applyPicked = (target: 'start' | 'end', picked: Date) => {
    const value = toLocalDateString(picked);
    if (target === 'start') {
      setStart(value);
      if (end < value) setEnd(value);
    } else {
      setEnd(value < start ? start : value);
    }
  };

  const handleAndroidChange = (_e: DateTimePickerChangeEvent, selected?: Date) => {
    const target = pickerTarget;
    setPickerTarget(null);
    if (selected && target) applyPicked(target, selected);
  };

  const confirmIOS = () => {
    if (pickerTarget) applyPicked(pickerTarget, tempDate);
    setPickerTarget(null);
  };

  const save = () => {
    const dates: string[] = [];
    for (let d = start; d <= end && dates.length <= MAX_RANGE_DAYS; d = addDays(d, 1)) dates.push(d);
    if (dates.length > MAX_RANGE_DAYS) {
      Alert.alert('That is a long stretch', `Pick up to ${MAX_RANGE_DAYS} days at a time.`);
      return;
    }
    excuseDays(dates, reason);
    setAdding(false);
  };

  const confirmRemove = (range: { start: string; end: string; dates: string[] }) => {
    Alert.alert('Remove excused days?', 'Those days go back to normal.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeExcuseDays(range.dates) },
    ]);
  };

  const rangeLabel = (a: string, b: string) => (a === b ? formatShortDate(a) : `${formatShortDate(a)} – ${formatShortDate(b)}`);

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Excused days" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        <Text style={styles.helper}>
          On an excused day, Expected activities marked "Can be excused" (set under Expected Activities) are optional,
          gigs open up, and the streak is kept. {name} can still do them, and they still count.
        </Text>

        {nextBirthday && (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{formatShortDate(nextBirthday)}</Text>
              <Text style={styles.rowMeta}>{name}'s birthday (automatic)</Text>
            </View>
            <Text style={styles.autoTag}>Auto</Text>
          </View>
        )}

        {upcoming.length > 0 && <Text style={styles.sectionLabel}>Upcoming</Text>}
        {upcoming.map((range) => (
          <View key={range.start} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{rangeLabel(range.start, range.end)}</Text>
              {range.reason ? (
                <Text style={styles.rowMeta}>{EXCUSE_REASON_LABELS[range.reason as DailyExcuseReason] ?? range.reason}</Text>
              ) : null}
            </View>
            <Pressable hitSlop={LINK_HIT_SLOP} onPress={() => confirmRemove(range)}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>+ Excuse a day or a range</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={adding} animationType="slide" transparent onRequestClose={() => setAdding(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAdding(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Excuse days</Text>
            <View style={styles.dateRow}>
              <Pressable style={styles.dateBox} onPress={() => openPicker('start')}>
                <Text style={styles.dateLabel}>From</Text>
                <Text style={styles.dateValue}>{formatShortDate(start)}</Text>
              </Pressable>
              <Pressable style={styles.dateBox} onPress={() => openPicker('end')}>
                <Text style={styles.dateLabel}>To</Text>
                <Text style={styles.dateValue}>{formatShortDate(end)}</Text>
              </Pressable>
            </View>
            <Text style={styles.dateLabel}>Reason (just for you)</Text>
            <View style={styles.chips}>
              {(Object.keys(EXCUSE_REASON_LABELS) as DailyExcuseReason[]).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setReason(reason === r ? undefined : r)}
                  style={[styles.chip, reason === r && styles.chipOn]}
                >
                  <Text style={[styles.chipText, reason === r && styles.chipTextOn]}>{EXCUSE_REASON_LABELS[r]}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.cancel} onPress={() => setAdding(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.save} onPress={save}>
                <Text style={styles.saveText}>Excuse</Text>
              </Pressable>
            </View>

            {pickerTarget && Platform.OS === 'android' && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="default"
                onValueChange={handleAndroidChange}
                onDismiss={() => setPickerTarget(null)}
              />
            )}
          </Pressable>
        </Pressable>
        {Platform.OS === 'ios' && pickerTarget && (
          <View style={[styles.iosPicker, { paddingBottom: 20 + insets.bottom }]}>
            <DateTimePicker value={tempDate} mode="date" display="spinner" onValueChange={(_, d) => d && setTempDate(d)} />
            <Pressable style={styles.save} onPress={confirmIOS}>
              <Text style={styles.saveText}>Done</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  helper: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  autoTag: { fontSize: 11, fontWeight: '800', color: colors.expected, backgroundColor: colors.background, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, overflow: 'hidden' },
  remove: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  addButton: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 14 },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  dateBox: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.surface },
  dateLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  dateValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  chipOn: { backgroundColor: colors.expected, borderColor: colors.expected },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextOn: { color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancel: { paddingVertical: 12, paddingHorizontal: 16 },
  cancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  save: { backgroundColor: colors.expected, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 22, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  iosPicker: { backgroundColor: colors.background, padding: 16 },
});
