// A read/manage view of schedule events, grouped by day of week for
// recurring events and by date for one-off ones. Not part of the original
// screens-and-flows.md spec — added because knowing what's already
// committed (school, practice, extracurriculars) is useful on its own, not
// just as an input to setup suggestions.
//
// Originally view-only — there was no way to add or edit anything here
// after setup finished. Now supports adding, editing, and deleting events
// manually, plus importing more from the (stubbed) Google Calendar flow.
//
// 'skip' events are omitted from the list here — they were explicitly
// marked as not worth tracking during schedule review/import.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, SectionList, Modal, Alert, StyleSheet } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../../context/AppDataContext';
import { ScheduleEvent, ScheduleEventCategory } from '../../types/models';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { colors } from '../../theme/colors';

type ScheduleNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Schedule'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORIES: { value: ScheduleEventCategory; label: string }[] = [
  { value: 'school', label: 'School' },
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'practice', label: 'Practice' },
  { value: 'skip', label: 'Skip' },
];

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

interface DraftState {
  title: string;
  category: ScheduleEventCategory;
  recurring: boolean;
  daysOfWeek: number[];
  date: string;
  startTime: string;
  endTime: string;
}

const BLANK_DRAFT: DraftState = {
  title: '',
  category: 'school',
  recurring: true,
  daysOfWeek: [],
  date: '',
  startTime: '',
  endTime: '',
};

export function ScheduleViewScreen() {
  const navigation = useNavigation<ScheduleNavigationProp>();
  const { scheduleEvents, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(BLANK_DRAFT);

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

  const openAddModal = () => {
    setEditingId(null);
    setDraft(BLANK_DRAFT);
    setModalVisible(true);
  };

  const openEditModal = (event: ScheduleEvent) => {
    setEditingId(event.id);
    setDraft({
      title: event.title,
      category: event.category,
      recurring: event.recurring,
      daysOfWeek: event.daysOfWeek ?? [],
      date: event.date ?? '',
      startTime: event.startTime ?? '',
      endTime: event.endTime ?? '',
    });
    setModalVisible(true);
  };

  const toggleDay = (day: number) => {
    setDraft((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day) ? prev.daysOfWeek.filter((d) => d !== day) : [...prev.daysOfWeek, day],
    }));
  };

  const confirmSave = () => {
    if (!draft.title.trim()) return;
    if (draft.recurring && draft.daysOfWeek.length === 0) return;
    if (!draft.recurring && !draft.date.trim()) return;

    const fields = {
      title: draft.title.trim(),
      category: draft.category,
      recurring: draft.recurring,
      daysOfWeek: draft.recurring ? draft.daysOfWeek : undefined,
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
      <AppHeader />
      <Text style={styles.title}>Schedule</Text>

      <SectionList
        contentContainerStyle={styles.listContent}
        sections={sections}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No schedule events yet.</Text>}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.eventRow} onPress={() => openEditModal(item)}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              {item.date && !item.recurring && <Text style={styles.eventMeta}>{item.date}</Text>}
              {formatTimeRange(item) && <Text style={styles.eventMeta}>{formatTimeRange(item)}</Text>}
            </View>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{CATEGORY_LABELS[item.category]}</Text>
            </View>
          </Pressable>
        )}
      />

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton} onPress={openAddModal}>
          <Text style={styles.actionButtonText}>+ Add event</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('ImportGoogleCalendar')}>
          <Text style={styles.actionButtonText}>Import from Google Calendar</Text>
        </Pressable>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit event' : 'Add event'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Event name"
              value={draft.title}
              onChangeText={(title) => setDraft((prev) => ({ ...prev, title }))}
            />

            <View style={styles.chipRow}>
              {CATEGORIES.map((category) => {
                const selected = draft.category === category.value;
                return (
                  <Pressable
                    key={category.value}
                    onPress={() => setDraft((prev) => ({ ...prev, category: category.value }))}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.repeatsRow}>
              <Text style={styles.fieldLabel}>Repeats weekly</Text>
              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => setDraft((prev) => ({ ...prev, recurring: true }))}
                  style={[styles.chip, draft.recurring && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, draft.recurring && styles.chipTextSelected]}>Yes</Text>
                </Pressable>
                <Pressable
                  onPress={() => setDraft((prev) => ({ ...prev, recurring: false }))}
                  style={[styles.chip, !draft.recurring && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, !draft.recurring && styles.chipTextSelected]}>No</Text>
                </Pressable>
              </View>
            </View>

            {draft.recurring ? (
              <View style={styles.chipRow}>
                {SHORT_DAY_LABELS.map((label, index) => {
                  const selected = draft.daysOfWeek.includes(index);
                  return (
                    <Pressable key={label} onPress={() => toggleDay(index)} style={[styles.dayChip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD)"
                value={draft.date}
                onChangeText={(date) => setDraft((prev) => ({ ...prev, date }))}
              />
            )}

            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="Start (HH:MM)"
                value={draft.startTime}
                onChangeText={(startTime) => setDraft((prev) => ({ ...prev, startTime }))}
              />
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="End (HH:MM)"
                value={draft.endTime}
                onChangeText={(endTime) => setDraft((prev) => ({ ...prev, endTime }))}
              />
            </View>

            <View style={styles.modalActions}>
              {editingId && (
                <Pressable style={styles.deleteButton} onPress={confirmDelete}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              )}
              <View style={styles.modalActionsRight}>
                <Pressable style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSaveButton} onPress={confirmSave}>
                  <Text style={styles.modalSaveText}>{editingId ? 'Save' : 'Add'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: 20, marginTop: 4, marginBottom: 8 },
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
  eventMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  categoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  categoryTagText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  actionButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: colors.expected, textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  repeatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  dayChip: { width: 44, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  chipSelected: { backgroundColor: colors.expected, borderColor: colors.expected },
  chipText: { fontSize: 12, color: colors.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeInput: { flex: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  modalActionsRight: { flexDirection: 'row', gap: 12 },
  deleteButton: { paddingVertical: 12, paddingHorizontal: 4 },
  deleteButtonText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  modalCancelButton: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  modalSaveButton: { backgroundColor: colors.expected, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
