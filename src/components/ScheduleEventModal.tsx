// Shared Add/Edit event form — used by both the onboarding wizard
// (ScheduleReviewScreen) and Settings → Schedule (ScheduleScreen), so the
// two flows can't drift out of sync with each other again. Visual language
// (category chips get their own darker "selected" treatment, distinct from
// the teal used for Repeats/cadence/day chips) matches what onboarding
// originally established; the native AM/PM time picker and the
// validation-feedback alert were Settings-only until now.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { ScheduleEventCategory, ScheduleEventCadence, CADENCE_LABELS } from '../types/models';
import { timeStringToDate, dateToTimeString, formatTime12h } from '../utils/time';
import { colors } from '../theme/colors';

export interface ScheduleEventDraft {
  title: string;
  category: ScheduleEventCategory;
  recurring: boolean;
  daysOfWeek: number[];
  cadence: ScheduleEventCadence;
  date: string;
  startTime: string;
  endTime: string;
}

export const BLANK_SCHEDULE_EVENT_DRAFT: ScheduleEventDraft = {
  title: '',
  category: 'school',
  recurring: true,
  daysOfWeek: [],
  cadence: 'weekly',
  date: '',
  startTime: '',
  endTime: '',
};

const CATEGORIES: { value: ScheduleEventCategory; label: string }[] = [
  { value: 'school', label: 'School' },
  { value: 'sports', label: 'Sports' },
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'music', label: 'Music' },
  { value: 'other', label: 'Other' },
];

// Monthly dropped from the picker — an edge case for the kind of recurring
// activities (school, sports, music) this form is for.
const CADENCE_OPTIONS: ScheduleEventCadence[] = ['daily', 'weekly', 'biweekly'];
const SHORT_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  visible: boolean;
  draft: ScheduleEventDraft;
  onChangeDraft: (updater: (prev: ScheduleEventDraft) => ScheduleEventDraft) => void;
  editing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function ScheduleEventModal({ visible, draft, onChangeDraft, editing, onSave, onCancel, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const [timePickerTarget, setTimePickerTarget] = useState<'startTime' | 'endTime' | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const toggleDay = (day: number) => {
    onChangeDraft((prev) => ({
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
      onChangeDraft((prev) => ({ ...prev, [target]: dateToTimeString(selectedDate) }));
    }
  };

  const confirmIOSTime = () => {
    if (timePickerTarget) {
      onChangeDraft((prev) => ({ ...prev, [timePickerTarget]: dateToTimeString(tempTime) }));
    }
    setTimePickerTarget(null);
  };

  const handleSave = () => {
    if (!draft.title.trim()) {
      Alert.alert('Event name needed', 'Give this event a name before saving.');
      return;
    }
    if (draft.recurring && draft.daysOfWeek.length === 0) {
      Alert.alert('Pick a day', 'Choose at least one day this event repeats on.');
      return;
    }
    if (!draft.recurring && !draft.date.trim()) {
      Alert.alert('Pick a date', 'Enter a date for this one-time event.');
      return;
    }
    onSave();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={styles.modalBackdrop} onPress={onCancel}>
        <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>{editing ? 'Edit event' : 'Add event'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Event name"
            value={draft.title}
            onChangeText={(title) => onChangeDraft((prev) => ({ ...prev, title }))}
          />

          <View style={styles.categoryRow}>
            {CATEGORIES.map((category) => {
              const selected = draft.category === category.value;
              return (
                <Pressable
                  key={category.value}
                  onPress={() => onChangeDraft((prev) => ({ ...prev, category: category.value }))}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                >
                  <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{category.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.repeatsRow}>
            <Text style={styles.fieldLabel}>Repeats</Text>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => onChangeDraft((prev) => ({ ...prev, recurring: true }))}
                style={[styles.chip, draft.recurring && styles.chipSelected]}
              >
                <Text style={[styles.chipText, draft.recurring && styles.chipTextSelected]}>Yes</Text>
              </Pressable>
              <Pressable
                onPress={() => onChangeDraft((prev) => ({ ...prev, recurring: false }))}
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
                    onPress={() => onChangeDraft((prev) => ({ ...prev, cadence: option }))}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{CADENCE_LABELS[option]}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {draft.recurring ? (
            <View style={styles.dayRow}>
              {SHORT_DAY_LABELS.map((label, index) => {
                const selected = draft.daysOfWeek.includes(index);
                return (
                  <Pressable key={label} onPress={() => toggleDay(index)} style={[styles.dayChip, selected && styles.dayChipSelected]}>
                    <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={draft.date}
              onChangeText={(date) => onChangeDraft((prev) => ({ ...prev, date }))}
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
                  <DateTimePicker value={tempTime} mode="time" display="spinner" onValueChange={(_, d) => d && setTempTime(d)} />
                  <Pressable style={styles.modalDoneButton} onPress={confirmIOSTime}>
                    <Text style={styles.modalDoneButtonText}>Done</Text>
                  </Pressable>
                </Pressable>
              </Pressable>
            </Modal>
          )}

          <View style={styles.modalActions}>
            <View>
              {editing && onDelete && (
                <Pressable style={styles.deleteButton} onPress={onDelete}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.modalActionsRight}>
              <Pressable style={styles.modalCancelButton} onPress={onCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={handleSave}>
                <Text style={styles.modalSaveText}>{editing ? 'Save' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
        </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: { backgroundColor: colors.text, borderColor: colors.text },
  categoryChipText: { fontSize: 12, color: colors.text },
  categoryChipTextSelected: { color: '#fff', fontWeight: '600' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  repeatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.expected, borderColor: colors.expected },
  chipText: { fontSize: 12, color: colors.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  dayChip: {
    width: 44,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dayChipSelected: { backgroundColor: colors.expected, borderColor: colors.expected },
  dayChipText: { fontSize: 12, color: colors.text },
  dayChipTextSelected: { color: '#fff', fontWeight: '600' },
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
