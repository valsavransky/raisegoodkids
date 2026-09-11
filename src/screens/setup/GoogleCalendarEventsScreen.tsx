// Shows the real events for the selected calendar once signed in (see
// ScheduleImportScreen/GoogleCalendarPickerScreen); falls back to the
// STUBBED mock events from src/data/mockGoogleCalendar.ts when not
// configured/signed in, normalized to the same ImportedScheduleEvent shape
// so the rest of this screen doesn't need to branch on the source.
//
// Selecting events here adds them both to the schedule (so they show up in
// the Schedule tab) and — for recurring commitments only — directly as a
// weekly Expected item, since a standing commitment like "Piano Lesson" is
// itself something the child is expected to show up for. A one-off event
// (e.g. a single dentist appointment) is added to the schedule but does NOT
// become a standing Expected item — it isn't a recurring responsibility.
//
// Scope note: ExpectedItem only has daily/weekly frequency, not specific
// days — an imported "Tuesdays only" event becomes a 'weekly' Expected item
// like any other, not one that only appears on Tuesdays. Day-precise
// Expected scheduling isn't built yet (today's home screen shows all active
// Expected items every day regardless of frequency).
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup, makeLocalId } from '../../context/SetupContext';
import { getMockEventsForCalendar } from '../../data/mockGoogleCalendar';
import { guessCategoryForTitle } from '../../data/practiceSuggestions';
import { getValidAccessToken } from '../../services/googleAuth';
import { fetchImportableEvents, ImportedScheduleEvent } from '../../services/googleCalendarApi';
import { colors } from '../../theme/colors';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const IMPORT_WINDOW_DAYS = 8 * 7; // ~8 weeks — enough to see a recurring weekday pattern

function mockEventsAsImported(calendarId: string): ImportedScheduleEvent[] {
  return getMockEventsForCalendar(calendarId).map((e) => ({
    id: e.id,
    title: e.title,
    category: guessCategoryForTitle(e.title),
    recurring: true,
    daysOfWeek: e.daysOfWeek,
    startTime: e.startTime,
    endTime: e.endTime,
  }));
}

function describeEvent(event: ImportedScheduleEvent): string {
  const time = event.startTime ? `${event.startTime}${event.endTime ? `-${event.endTime}` : ''}` : '';
  if (event.recurring) {
    const days = (event.daysOfWeek ?? []).map((d) => DAY_LABELS[d]).join('/');
    return [days, time].filter(Boolean).join(' ');
  }
  return [event.date, time].filter(Boolean).join(' ');
}

type Props = NativeStackScreenProps<SetupStackParamList, 'GoogleCalendarEvents'>;

export function GoogleCalendarEventsScreen({ route, navigation }: Props) {
  const { calendarId } = route.params;
  const { scheduleEvents, setScheduleEvents, expectedItems, setExpectedItems } = useSetup();
  const [events, setEvents] = useState<ImportedScheduleEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getValidAccessToken();
      let result: ImportedScheduleEvent[];
      if (!token) {
        result = mockEventsAsImported(calendarId);
      } else {
        try {
          const windowStart = new Date();
          const windowEnd = new Date(Date.now() + IMPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
          result = await fetchImportableEvents(token, calendarId, windowStart, windowEnd);
        } catch {
          if (!cancelled) setError('Could not load events for this calendar. Check your connection and try again.');
          result = [];
        }
      }
      if (!cancelled) {
        setEvents(result);
        setSelectedIds(result.map((e) => e.id));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [calendarId]);

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
        category: e.category,
        recurring: e.recurring,
        daysOfWeek: e.daysOfWeek,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
    ]);

    // Only recurring commitments become a standing Expected item directly —
    // a one-off event isn't a recurring responsibility.
    const recurringSelected = selected.filter((e) => e.recurring);
    setExpectedItems([
      ...expectedItems,
      ...recurringSelected.map((e) => ({
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
      <ScreenHeader title="Calendar events" step={2} totalSteps={3} onBack={() => navigation.goBack()} />
      <Text style={styles.helperText}>
        Select the ones worth tracking — they'll be added to the schedule, and recurring ones to Expected too.
      </Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={events}
          keyExtractor={(event) => event.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No events found on this calendar.</Text>}
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.id);
            return (
              <Pressable style={styles.eventRow} onPress={() => toggle(item.id)}>
                <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                  {selected && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventMeta}>{describeEvent(item)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
      <Pressable style={styles.confirmButton} onPress={confirmImport}>
        <Text style={styles.confirmButtonText}>Add {selectedIds.length} event{selectedIds.length === 1 ? '' : 's'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  helperText: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 20, marginBottom: 12 },
  errorText: { fontSize: 13, color: colors.danger, paddingHorizontal: 20, marginBottom: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
