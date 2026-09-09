// STUBBED: recurring events come from src/data/mockGoogleCalendar.ts, not a
// real Calendar API call. Selecting events here adds them both to the
// schedule (so they show up in the Schedule tab) and directly as Expected
// items — a recurring commitment like "Piano Lesson" is itself something
// the child is expected to show up for, per the user's request to skip a
// separate categorize-then-suggest step for calendar-sourced events.
//
// Scope note: ExpectedItem only has daily/weekly frequency, not specific
// days — an imported "Tuesdays only" event becomes a 'weekly' Expected item
// like any other, not one that only appears on Tuesdays. Day-precise
// Expected scheduling isn't built yet (today's home screen shows all active
// Expected items every day regardless of frequency).
import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup, makeLocalId } from '../../context/SetupContext';
import { getMockEventsForCalendar } from '../../data/mockGoogleCalendar';
import { colors } from '../../theme/colors';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = NativeStackScreenProps<SetupStackParamList, 'GoogleCalendarEvents'>;

export function GoogleCalendarEventsScreen({ route, navigation }: Props) {
  const { calendarId } = route.params;
  const events = getMockEventsForCalendar(calendarId);
  const { scheduleEvents, setScheduleEvents, expectedItems, setExpectedItems } = useSetup();
  const [selectedIds, setSelectedIds] = useState<string[]>(events.map((e) => e.id));

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const confirmImport = () => {
    const selected = events.filter((e) => selectedIds.includes(e.id));

    setScheduleEvents([
      ...scheduleEvents,
      ...selected.map((e) => ({
        localId: makeLocalId('event'),
        title: e.title,
        category: 'extracurricular' as const,
        recurring: true,
        daysOfWeek: e.daysOfWeek,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
    ]);

    setExpectedItems([
      ...expectedItems,
      ...selected.map((e) => ({
        localId: makeLocalId('expected'),
        name: e.title,
        frequency: 'weekly' as const,
        active: true,
      })),
    ]);

    navigation.navigate('ScheduleReview');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Recurring events" step={2} totalSteps={3} onBack={() => navigation.goBack()} />
      <Text style={styles.helperText}>
        Select the ones worth tracking — they'll be added to the schedule and to Expected.
      </Text>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={events}
        keyExtractor={(event) => event.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No recurring events found on this calendar.</Text>}
        renderItem={({ item }) => {
          const selected = selectedIds.includes(item.id);
          const days = item.daysOfWeek.map((d) => DAY_LABELS[d]).join('/');
          return (
            <Pressable style={styles.eventRow} onPress={() => toggle(item.id)}>
              <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                {selected && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>
                  {days} {item.startTime}-{item.endTime}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable style={styles.confirmButton} onPress={confirmImport}>
        <Text style={styles.confirmButtonText}>Add {selectedIds.length} event{selectedIds.length === 1 ? '' : 's'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  helperText: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 20, marginBottom: 12 },
  listContent: { paddingHorizontal: 20 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.expected, borderColor: colors.expected },
  checkboxMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  eventInfo: { flexShrink: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  eventMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  confirmButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 4,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
