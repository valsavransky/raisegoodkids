// A read view of the schedule events collected during setup (screen 6),
// grouped by day of week for recurring events and by date for one-off ones.
// Not part of the original screens-and-flows.md spec — added because
// knowing what's already committed (school, practice, extracurriculars)
// is useful on its own, not just as an input to setup suggestions.
//
// 'skip' events are omitted here — they were explicitly marked as not
// worth tracking during schedule review.
import React from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { useAppData } from '../../context/AppDataContext';
import { ScheduleEvent, ScheduleEventCategory } from '../../types/models';
import { colors } from '../../theme/colors';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CATEGORY_LABELS: Record<ScheduleEventCategory, string> = {
  school: 'School',
  extracurricular: 'Extracurricular',
  practice: 'Practice',
  skip: 'Skip',
};

function formatTimeRange(event: ScheduleEvent): string | null {
  if (!event.startTime) return null;
  return event.endTime ? `${event.startTime}-${event.endTime}` : event.startTime;
}

export function ScheduleViewScreen() {
  const { scheduleEvents } = useAppData();
  const trackedEvents = scheduleEvents.filter((e) => e.category !== 'skip');

  const recurringByDay = DAY_LABELS.map((label, dayIndex) => ({
    title: label,
    data: trackedEvents
      .filter((e) => e.recurring && (e.daysOfWeek ?? []).includes(dayIndex))
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
  })).filter((section) => section.data.length > 0);

  const oneOff = trackedEvents
    .filter((e) => !e.recurring)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

  const sections = [
    ...recurringByDay,
    ...(oneOff.length > 0 ? [{ title: 'One-time events', data: oneOff }] : []),
  ];

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Schedule</Text>
      <SectionList
        contentContainerStyle={styles.listContent}
        sections={sections}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No schedule events yet.</Text>}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              {item.date && !item.recurring && <Text style={styles.eventMeta}>{item.date}</Text>}
              {formatTimeRange(item) && <Text style={styles.eventMeta}>{formatTimeRange(item)}</Text>}
            </View>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{CATEGORY_LABELS[item.category]}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: 20, marginBottom: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: colors.textMuted, marginTop: 16, marginBottom: 8 },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  eventInfo: { flexShrink: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  eventMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  categoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  categoryTagText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
});
