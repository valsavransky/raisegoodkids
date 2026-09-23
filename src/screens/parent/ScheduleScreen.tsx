// Settings → Schedule. A read/manage view of schedule events, grouped by
// day of week for recurring events and by date for one-off ones. Moved out
// of the bottom tab bar (see priorities doc, "Rethink the Schedule
// surface") — its only ongoing job is occasional add/edit/delete of
// recurring commitments, a low-frequency task that doesn't need a
// permanent tab, matching how Expected Items and Gigs management already
// live here instead of their own tabs. "What's on today" now surfaces on
// Today's Trail instead (src/data/schedule.ts), which was the part of this
// screen a kid/parent actually needed daily.
//
// The Add/Edit form itself is the shared ScheduleEventModal component, also
// used by the onboarding wizard's ScheduleReviewScreen — previously each
// screen had its own near-duplicate modal that had drifted out of sync.
import React, { useState } from 'react';
import { View, Text, Pressable, SectionList, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppData } from '../../context/AppDataContext';
import { ScheduleEvent, ScheduleEventCategory, CADENCE_LABELS } from '../../types/models';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { ScheduleEventModal, ScheduleEventDraft, BLANK_SCHEDULE_EVENT_DRAFT } from '../../components/ScheduleEventModal';
import { formatTimeRange12h } from '../../utils/time';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ScheduleSettings'>;

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CATEGORY_LABELS: Record<ScheduleEventCategory, string> = {
  school: 'School',
  sports: 'Sports',
  extracurricular: 'Extracurricular',
  music: 'Music',
  other: 'Other',
};

export function ScheduleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { scheduleEvents, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScheduleEventDraft>(BLANK_SCHEDULE_EVENT_DRAFT);

  const recurringByDay = DAY_LABELS.map((label, dayIndex) => ({
    title: label,
    data: scheduleEvents
      .filter((e) => e.recurring && (e.daysOfWeek ?? []).includes(dayIndex))
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
  })).filter((section) => section.data.length > 0);

  const oneOff = scheduleEvents
    .filter((e) => !e.recurring)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

  const sections = [
    ...recurringByDay,
    ...(oneOff.length > 0 ? [{ title: 'One-time events', data: oneOff }] : []),
  ];

  const openAddModal = () => {
    setEditingId(null);
    setDraft(BLANK_SCHEDULE_EVENT_DRAFT);
    setModalVisible(true);
  };

  const openEditModal = (event: ScheduleEvent) => {
    setEditingId(event.id);
    setDraft({
      title: event.title,
      category: event.category,
      recurring: event.recurring,
      daysOfWeek: event.daysOfWeek ?? [],
      cadence: event.cadence ?? 'weekly',
      date: event.date ?? '',
      startTime: event.startTime ?? '',
      endTime: event.endTime ?? '',
    });
    setModalVisible(true);
  };

  const confirmSave = () => {
    const fields = {
      title: draft.title.trim(),
      category: draft.category,
      recurring: draft.recurring,
      daysOfWeek: draft.recurring ? draft.daysOfWeek : undefined,
      cadence: draft.recurring ? draft.cadence : undefined,
      date: draft.recurring ? undefined : draft.date.trim(),
      startTime: draft.startTime.trim() || undefined,
      endTime: draft.endTime.trim() || undefined,
      source: 'manual' as const,
    };

    if (editingId) {
      updateScheduleEvent(editingId, fields);
    } else {
      addScheduleEvent(fields);
    }
    setModalVisible(false);
  };

  const confirmDelete = () => {
    if (!editingId) return;
    Alert.alert('Delete event', 'Remove this from the schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteScheduleEvent(editingId);
          setModalVisible(false);
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Schedule" onBack={() => navigation.goBack()} />

      <SectionList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        sections={sections}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No schedule events yet.</Text>}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.eventRow} onPress={() => openEditModal(item)}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <View style={styles.eventMetaRow}>
                {item.recurring && (
                  <View style={styles.cadenceTag}>
                    <Text style={styles.cadenceTagText}>{CADENCE_LABELS[item.cadence ?? 'weekly']}</Text>
                  </View>
                )}
                {item.date && !item.recurring && <Text style={styles.eventMeta}>{item.date}</Text>}
                {formatTimeRange12h(item.startTime, item.endTime) && (
                  <Text style={styles.eventMeta}>{formatTimeRange12h(item.startTime, item.endTime)}</Text>
                )}
              </View>
            </View>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{CATEGORY_LABELS[item.category]}</Text>
            </View>
          </Pressable>
        )}
      />

      <View style={[styles.actionsRow, { paddingBottom: 12 + insets.bottom }]}>
        <Pressable style={styles.actionButton} onPress={openAddModal}>
          <Text style={styles.actionButtonText}>+ Add event</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('ImportGoogleCalendar')}>
          <Text style={styles.actionButtonText}>Import from Google Calendar</Text>
        </Pressable>
      </View>

      <ScheduleEventModal
        visible={modalVisible}
        draft={draft}
        onChangeDraft={setDraft}
        editing={editingId !== null}
        onSave={confirmSave}
        onCancel={() => setModalVisible(false)}
        onDelete={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 8 },
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
  categoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  categoryTagText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  actionButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: colors.expected, textAlign: 'center' },
});
