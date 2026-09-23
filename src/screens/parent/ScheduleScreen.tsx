// Settings → Schedule. A read/manage view of schedule events, grouped by
// day of week for recurring events and by date for one-off ones. Moved out
// of the bottom tab bar (see priorities doc, "Rethink the Schedule
// surface") — its only ongoing job is occasional add/edit/delete of
// recurring commitments, a low-frequency task that doesn't need a
// permanent tab, matching how Expected Items and Gigs management already
// live here instead of their own tabs. "What's on today" now surfaces on
// Today's Trail instead (src/data/schedule.ts), which was the part of this
// screen a kid/parent actually needed daily.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, SectionList, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppData } from '../../context/AppDataContext';
import { ScheduleEvent, ScheduleEventCategory, ScheduleEventCadence, CADENCE_LABELS } from '../../types/models';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ScheduleSettings'>;

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORIES: { value: ScheduleEventCategory; label: string }[] = [
  { value: 'school', label: 'School' },
  { value: 'sports', label: 'Sports' },
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'music', label: 'Music' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_LABELS: Record<ScheduleEventCategory, string> = {
  school: 'School',
  sports: 'Sports',
  extracurricular: 'Extracurricular',
  music: 'Music',
  other: 'Other',
};

// Monthly dropped from the manual picker — an edge case for the kind of
// recurring activities (school, sports, music) this screen is for. Calendar
// imports can still produce a 'monthly' event (see googleCalendarApi.ts),
// and CADENCE_LABELS still has a label for it, so an imported one still
// displays correctly — it just isn't offered as a choice when adding by hand.
const CADENCE_OPTIONS: ScheduleEventCadence[] = ['daily', 'weekly', 'biweekly'];

function timeStringToDate(hhmm: string): Date {
  const d = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(Number.isFinite(h) ? h : 15, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatTime12h(hhmm: string): string {
  return timeStringToDate(hhmm).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatTimeRange(event: ScheduleEvent): string | null {
  if (!event.startTime) return null;
  return event.endTime ? `${formatTime12h(event.startTime)}–${formatTime12h(event.endTime)}` : formatTime12h(event.startTime);
}

interface DraftState {
  title: string;
  category: ScheduleEventCategory;
  recurring: boolean;
  daysOfWeek: number[];
  cadence: ScheduleEventCadence;
  date: string;
  startTime: string;
  endTime: string;
}

const BLANK_DRAFT: DraftState = {
  title: '',
  category: 'school',
  recurring: true,
  daysOfWeek: [],
  cadence: 'weekly',
  date: '',
  startTime: '',
  endTime: '',
};

export function ScheduleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { scheduleEvents, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(BLANK_DRAFT);

  const [timePickerTarget, setTimePickerTarget] = useState<'startTime' | 'endTime' | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());

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
      cadence: event.cadence ?? 'weekly',
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

  const openTimePicker = (target: 'startTime' | 'endTime') => {
    setTempTime(draft[target] ? timeStringToDate(draft[target]) : new Date());
    setTimePickerTarget(target);
  };

  const handleAndroidTimeChange = (_event: DateTimePickerChangeEvent, selectedDate?: Date) => {
    const target = timePickerTarget;
    setTimePickerTarget(null);
    if (selectedDate && target) {
      setDraft((prev) => ({ ...prev, [target]: dateToTimeString(selectedDate) }));
    }
  };

  const confirmIOSTime = () => {
    if (timePickerTarget) {
      setDraft((prev) => ({ ...prev, [timePickerTarget]: dateToTimeString(tempTime) }));
    }
    setTimePickerTarget(null);
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
                {formatTimeRange(item) && <Text style={styles.eventMeta}>{formatTimeRange(item)}</Text>}
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

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
              <Text style={styles.fieldLabel}>Repeats</Text>
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

            {draft.recurring && (
              <View style={styles.chipRow}>
                {CADENCE_OPTIONS.map((option) => {
                  const selected = draft.cadence === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setDraft((prev) => ({ ...prev, cadence: option }))}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {CADENCE_LABELS[option]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

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
              <Pressable style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('startTime')}>
                <Text style={draft.startTime ? styles.timeValueText : styles.timeValuePlaceholder}>
                  {draft.startTime ? formatTime12h(draft.startTime) : 'Start time'}
                </Text>
              </Pressable>
              <Pressable style={[styles.input, styles.timeInput]} onPress={() => openTimePicker('endTime')}>
                <Text style={draft.endTime ? styles.timeValueText : styles.timeValuePlaceholder}>
                  {draft.endTime ? formatTime12h(draft.endTime) : 'End time'}
                </Text>
              </Pressable>
            </View>

            {timePickerTarget && Platform.OS === 'android' && (
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="default"
                onValueChange={handleAndroidTimeChange}
                onDismiss={() => setTimePickerTarget(null)}
              />
            )}

            {Platform.OS === 'ios' && (
              <Modal visible={timePickerTarget !== null} animationType="slide" transparent onRequestClose={() => setTimePickerTarget(null)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setTimePickerTarget(null)}>
                  <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
                    <DateTimePicker
                      value={tempTime}
                      mode="time"
                      display="spinner"
                      onValueChange={(_, d) => d && setTempTime(d)}
                    />
                    <Pressable style={styles.modalDoneButton} onPress={confirmIOSTime}>
                      <Text style={styles.modalDoneButtonText}>Done</Text>
                    </Pressable>
                  </Pressable>
                </Pressable>
              </Modal>
            )}

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
          </ScrollView>
          </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
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
  timeValueText: { fontSize: 16, color: colors.text },
  timeValuePlaceholder: { fontSize: 16, color: colors.textMuted },
  modalDoneButton: {
    marginTop: 8,
    backgroundColor: colors.expected,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDoneButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  modalActionsRight: { flexDirection: 'row', gap: 12 },
  deleteButton: { paddingVertical: 12, paddingHorizontal: 4 },
  deleteButtonText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  modalCancelButton: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  modalSaveButton: { backgroundColor: colors.expected, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
