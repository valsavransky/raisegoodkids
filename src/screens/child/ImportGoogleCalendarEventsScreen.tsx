// Runtime counterpart to src/screens/setup/GoogleCalendarEventsScreen.tsx —
// fetches real events for the signed-in user once configured, writing into
// AppDataContext (the live app data) instead of the setup wizard's draft
// state. Falls back to the STUBBED mock events (adapted to the same
// ImportedScheduleEvent shape) when not signed in.
//
// As in the setup wizard: only recurring commitments become a standing
// weekly Expected item directly — a one-off event is added to the schedule
// but isn't a recurring responsibility.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ImportGoogleCalendarEvents'>;

export function ImportGoogleCalendarEventsScreen({ route, navigation }: Props) {
  const { calendarId } = route.params;
  const { addScheduleEvent, addExpectedItem } = useAppData();
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
    selected.forEach((e) => {
      addScheduleEvent({
        title: e.title,
        category: e.category,
        recurring: e.recurring,
        daysOfWeek: e.daysOfWeek,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        source: 'google_calendar',
      });
      // Only recurring commitments become a standing Expected item directly
      // — a one-off event isn't a recurring responsibility.
      if (e.recurring) {
        addExpectedItem({ name: e.title, frequency: 'weekly' });
      }
    });
    navigation.popToTop();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backButton}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Calendar events</Text>
        <View style={{ width: 44 }} />
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  backButton: { fontSize: 15, color: colors.textMuted, width: 44 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
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
