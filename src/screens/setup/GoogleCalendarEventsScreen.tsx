// Shows the real events for the selected calendar once signed in (see
// ScheduleImportScreen/GoogleCalendarPickerScreen); falls back to the
// STUBBED mock events from src/data/mockGoogleCalendar.ts when not
// configured/signed in, normalized to the same ImportedScheduleEvent shape
// so the rest of this screen doesn't need to branch on the source.
//
// Selecting events here only adds them to the schedule (so they show up in
// the Schedule tab) — a calendar commitment like "Piano Lesson" is the
// schedule of an activity, not a daily/weekly responsibility the child
// initiates at home, so it deliberately does NOT become an Expected item on
// its own. The practice-suggestion engine (see ScheduleReviewScreen) is the
// only path from a calendar event to an Expected item, since "Practice
// piano" (unlike "Piano Lesson" itself) genuinely is something to do at home.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup, makeLocalId } from '../../context/SetupContext';
import { getMockEventsForCalendar } from '../../data/mockGoogleCalendar';
import { guessCategoryForTitle } from '../../data/practiceSuggestions';
import { getValidAccessToken } from '../../services/googleAuth';
import { fetchImportableEvents, ImportedScheduleEvent } from '../../services/googleCalendarApi';
import { CADENCE_LABELS } from '../../types/models';
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
    cadence: 'weekly',
    startTime: e.startTime,
    endTime: e.endTime,
  }));
}

// Matches on the child's first name only — real calendar titles are things
// like "Rayna - Piano" or "Rayna's swim lesson," not full names.
function titleMentionsChild(title: string, childName: string): boolean {
  const firstName = childName.trim().split(/\s+/)[0];
  if (!firstName) return false;
  return title.toLowerCase().includes(firstName.toLowerCase());
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
  const insets = useSafeAreaInsets();
  const { calendarId } = route.params;
  const { childProfile, scheduleEvents, setScheduleEvents } = useSetup();
  const [events, setEvents] = useState<ImportedScheduleEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameFiltered, setNameFiltered] = useState(false);

  // Titles already sitting in the schedule (added on an earlier pass through
  // this wizard, or via a prior calendar connection) — matched by title
  // alone since that's the one stable, human-visible identity a re-fetch
  // shares with what's already saved. Re-importing these as new selections
  // would just duplicate the row.
  const alreadyAddedTitles = useMemo(
    () => new Set(scheduleEvents.map((e) => e.title.trim().toLowerCase())),
    [scheduleEvents]
  );

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
        // Pre-check only recurring events — a repeated commitment (piano
        // every Tuesday) is almost always worth tracking, while a one-off
        // (a single dentist appointment) usually isn't. One-offs still show
        // up, just unchecked, so they're easy to add if they do matter.
        const recurringCandidates = result.filter(
          (e) => e.recurring && !alreadyAddedTitles.has(e.title.trim().toLowerCase())
        );
        // On a shared family calendar, narrow further to events that
        // actually mention this child — otherwise a sibling's or parent's
        // recurring activity gets pre-checked right alongside theirs. Only
        // narrows when it finds at least one match; a calendar that never
        // names the child in a title (common for a single-child household's
        // own calendar) falls back to the plain "all recurring" behavior
        // rather than pre-selecting nothing.
        const nameMatched = recurringCandidates.filter((e) => titleMentionsChild(e.title, childProfile.name));
        setNameFiltered(nameMatched.length > 0);
        setSelectedIds((nameMatched.length > 0 ? nameMatched : recurringCandidates).map((e) => e.id));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // alreadyAddedTitles intentionally excluded — only used to seed the
    // initial selection when this calendar's events load, not to re-run
    // the fetch whenever the schedule changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        cadence: e.cadence,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
    ]);

    navigation.navigate('ScheduleReview');
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Calendar events"
        step={2}
        totalSteps={4}
        onBack={() => navigation.goBack()}
        childName={childProfile.name}
        childAvatarId={childProfile.avatarId}
        onPressProfile={() => navigation.navigate('ChildProfile')}
      />
      <Text style={styles.helperText}>
        {nameFiltered
          ? `Pre-selected recurring events that mention ${childProfile.name.trim().split(/\s+/)[0] || 'your child'} — toggle any others worth tracking too.`
          : 'Select the ones worth tracking — they\'ll be added to your schedule.'}
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
            const alreadyAdded = alreadyAddedTitles.has(item.title.trim().toLowerCase());
            const selected = !alreadyAdded && selectedIds.includes(item.id);
            return (
              <Pressable
                style={[styles.eventRow, alreadyAdded && styles.eventRowDisabled]}
                onPress={() => !alreadyAdded && toggle(item.id)}
                disabled={alreadyAdded}
              >
                <View style={[styles.checkbox, selected && styles.checkboxChecked, alreadyAdded && styles.checkboxDisabled]}>
                  {selected && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, alreadyAdded && styles.eventTitleDisabled]}>{item.title}</Text>
                  <View style={styles.eventMetaRow}>
                    {alreadyAdded ? (
                      <View style={styles.alreadyAddedTag}>
                        <Text style={styles.alreadyAddedTagText}>Already added</Text>
                      </View>
                    ) : (
                      item.recurring && (
                        <View style={styles.cadenceTag}>
                          <Text style={styles.cadenceTagText}>{CADENCE_LABELS[item.cadence ?? 'weekly']}</Text>
                        </View>
                      )
                    )}
                    <Text style={styles.eventMeta}>{describeEvent(item)}</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
      <Pressable style={[styles.confirmButton, { marginBottom: 20 + insets.bottom }]} onPress={confirmImport}>
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
  checkboxDisabled: { borderColor: colors.border, opacity: 0.5 },
  checkboxMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  eventInfo: { flexShrink: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  eventTitleDisabled: { color: colors.textMuted },
  eventRowDisabled: { opacity: 0.5 },
  alreadyAddedTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alreadyAddedTagText: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  eventMeta: { fontSize: 12, color: colors.textMuted },
  cadenceTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cadenceTagText: { fontSize: 11, color: colors.expected, fontWeight: '700' },
  confirmButton: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
