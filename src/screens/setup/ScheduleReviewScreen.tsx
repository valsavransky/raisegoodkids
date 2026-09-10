// Screen 6: parent setup, step 2 of 3 (continued) — schedule review/tagging.
// The convergence point for both the "connect calendar" and "skip" paths
// from screen 5; today only the skip path feeds events in (manually added
// here), since calendar import isn't wired up yet.
//
// Manual entry uses structured fields (name, day(s)/date, start/end time,
// whether it repeats) rather than a single free-form recurrence string, so
// events can later be rendered as a real schedule view.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Modal, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup, DraftScheduleEvent, makeLocalId } from '../../context/SetupContext';
import { ScheduleEventCategory } from '../../types/models';
import {
  categoryTriggersSuggestion,
  suggestExpectedItemForEvent,
} from '../../data/practiceSuggestions';
import { colors } from '../../theme/colors';

const CATEGORIES: { value: ScheduleEventCategory; label: string }[] = [
  { value: 'school', label: 'School' },
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'practice', label: 'Practice' },
  { value: 'skip', label: 'Skip' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function describeSchedule(event: DraftScheduleEvent): string {
  const time = event.startTime ? `${event.startTime}${event.endTime ? `-${event.endTime}` : ''}` : '';
  if (event.recurring) {
    const days = (event.daysOfWeek ?? []).map((d) => DAY_LABELS[d]).join('/');
    return [days, time].filter(Boolean).join(' ');
  }
  return [event.date, time].filter(Boolean).join(' ');
}

type Props = NativeStackScreenProps<SetupStackParamList, 'ScheduleReview'>;

type SuggestionStatus = 'pending' | 'added' | 'dismissed';

export function ScheduleReviewScreen({ navigation }: Props) {
  const { scheduleEvents, setScheduleEvents, expectedItems, setExpectedItems } = useSetup();
  const [suggestionStatus, setSuggestionStatus] = useState<Record<string, SuggestionStatus>>({});
  const [genericSuggestionDrafts, setGenericSuggestionDrafts] = useState<Record<string, string>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState<ScheduleEventCategory>('school');
  const [draftRecurring, setDraftRecurring] = useState(true);
  const [draftDaysOfWeek, setDraftDaysOfWeek] = useState<number[]>([]);
  const [draftDate, setDraftDate] = useState('');
  const [draftStartTime, setDraftStartTime] = useState('');
  const [draftEndTime, setDraftEndTime] = useState('');

  const updateCategory = (localId: string, category: ScheduleEventCategory) => {
    setScheduleEvents(
      scheduleEvents.map((event) => (event.localId === localId ? { ...event, category } : event))
    );
  };

  // Payoff mechanism from screen 6: the moment an event is tagged Practice
  // or School, offer the related Expected item the lookup table suggests —
  // right here, not a separate screen.
  const acceptSuggestion = (name: string, localId: string) => {
    if (!name.trim()) return;
    setExpectedItems([
      ...expectedItems,
      { localId: makeLocalId('expected'), name: name.trim(), frequency: 'daily', active: true },
    ]);
    setSuggestionStatus((prev) => ({ ...prev, [localId]: 'added' }));
  };

  const dismissSuggestion = (localId: string) => {
    setSuggestionStatus((prev) => ({ ...prev, [localId]: 'dismissed' }));
  };

  const openAddModal = () => {
    setDraftTitle('');
    setDraftCategory('school');
    setDraftRecurring(true);
    setDraftDaysOfWeek([]);
    setDraftDate('');
    setDraftStartTime('');
    setDraftEndTime('');
    setModalVisible(true);
  };

  const toggleDay = (day: number) => {
    setDraftDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const confirmAdd = () => {
    if (!draftTitle.trim()) return;
    if (draftRecurring && draftDaysOfWeek.length === 0) return;
    if (!draftRecurring && !draftDate.trim()) return;
    const event: DraftScheduleEvent = {
      localId: makeLocalId('event'),
      title: draftTitle.trim(),
      category: draftCategory,
      recurring: draftRecurring,
      daysOfWeek: draftRecurring ? draftDaysOfWeek : undefined,
      date: draftRecurring ? undefined : draftDate.trim(),
      startTime: draftStartTime.trim() || undefined,
      endTime: draftEndTime.trim() || undefined,
    };
    setScheduleEvents([...scheduleEvents, event]);
    setModalVisible(false);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Review schedule" step={2} totalSteps={3} onBack={() => navigation.goBack()} />

      <Text style={styles.helperText}>Anything not tagged counts as free time for gigs.</Text>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={scheduleEvents}
        keyExtractor={(event) => event.localId}
        ListEmptyComponent={<Text style={styles.emptyText}>No events yet — add anything worth knowing about.</Text>}
        renderItem={({ item }) => {
          const status = suggestionStatus[item.localId] ?? 'pending';
          const showSuggestion = status === 'pending' && categoryTriggersSuggestion(item.category);
          const suggestion = showSuggestion ? suggestExpectedItemForEvent(item.title) : null;

          return (
            <View style={styles.eventRow}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventRecurrence}>{describeSchedule(item)}</Text>
              </View>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((category) => {
                  const selected = item.category === category.value;
                  return (
                    <Pressable
                      key={category.value}
                      onPress={() => updateCategory(item.localId, category.value)}
                      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                    >
                      <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                        {category.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {suggestion && !suggestion.isGeneric && (
                <View style={styles.suggestionCard}>
                  <Text style={styles.suggestionText}>
                    Add <Text style={styles.suggestionName}>"{suggestion.name}"</Text> to Expected?
                  </Text>
                  <View style={styles.suggestionActions}>
                    <Pressable onPress={() => dismissSuggestion(item.localId)} style={styles.suggestionDismiss}>
                      <Text style={styles.suggestionDismissText}>No thanks</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => acceptSuggestion(suggestion.name, item.localId)}
                      style={styles.suggestionAdd}
                    >
                      <Text style={styles.suggestionAddText}>Add</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {suggestion && suggestion.isGeneric && (
                <View style={styles.suggestionCard}>
                  <Text style={styles.suggestionText}>
                    Add a related Expected item for "{item.title}"?
                  </Text>
                  <TextInput
                    style={styles.suggestionInput}
                    placeholder="e.g. Practice reading"
                    value={genericSuggestionDrafts[item.localId] ?? ''}
                    onChangeText={(text) =>
                      setGenericSuggestionDrafts((prev) => ({ ...prev, [item.localId]: text }))
                    }
                  />
                  <View style={styles.suggestionActions}>
                    <Pressable onPress={() => dismissSuggestion(item.localId)} style={styles.suggestionDismiss}>
                      <Text style={styles.suggestionDismissText}>No thanks</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => acceptSuggestion(genericSuggestionDrafts[item.localId] ?? '', item.localId)}
                      style={styles.suggestionAdd}
                    >
                      <Text style={styles.suggestionAddText}>Add</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      <Pressable style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>+ Add event manually</Text>
      </Pressable>

      <Pressable style={styles.continueButton} onPress={() => navigation.navigate('ExpectedGigsSetup')}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add event</Text>
            <TextInput
              style={styles.input}
              placeholder="Event name"
              value={draftTitle}
              onChangeText={setDraftTitle}
            />

            <View style={styles.categoryRow}>
              {CATEGORIES.map((category) => {
                const selected = draftCategory === category.value;
                return (
                  <Pressable
                    key={category.value}
                    onPress={() => setDraftCategory(category.value)}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.repeatsRow}>
              <Text style={styles.fieldLabel}>Repeats weekly</Text>
              <View style={styles.repeatsToggle}>
                <Pressable
                  onPress={() => setDraftRecurring(true)}
                  style={[styles.repeatsOption, draftRecurring && styles.repeatsOptionSelected]}
                >
                  <Text style={[styles.repeatsOptionText, draftRecurring && styles.repeatsOptionTextSelected]}>Yes</Text>
                </Pressable>
                <Pressable
                  onPress={() => setDraftRecurring(false)}
                  style={[styles.repeatsOption, !draftRecurring && styles.repeatsOptionSelected]}
                >
                  <Text style={[styles.repeatsOptionText, !draftRecurring && styles.repeatsOptionTextSelected]}>No</Text>
                </Pressable>
              </View>
            </View>

            {draftRecurring ? (
              <View style={styles.dayRow}>
                {DAY_LABELS.map((label, index) => {
                  const selected = draftDaysOfWeek.includes(index);
                  return (
                    <Pressable
                      key={label}
                      onPress={() => toggleDay(index)}
                      style={[styles.dayChip, selected && styles.dayChipSelected]}
                    >
                      <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={draftDate} onChangeText={setDraftDate} />
            )}

            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="Start (HH:MM)"
                value={draftStartTime}
                onChangeText={setDraftStartTime}
              />
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="End (HH:MM)"
                value={draftEndTime}
                onChangeText={setDraftEndTime}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalAddButton} onPress={confirmAdd}>
                <Text style={styles.modalAddText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  helperText: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 20, marginBottom: 8 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  eventRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  eventInfo: { marginBottom: 10 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  eventRecurrence: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  suggestionCard: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.expected,
    padding: 12,
    marginTop: -2,
    marginBottom: 4,
  },
  suggestionText: { fontSize: 13, color: colors.text },
  suggestionName: { fontWeight: '700' },
  suggestionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    marginTop: 8,
  },
  suggestionActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  suggestionDismiss: { paddingVertical: 6, paddingHorizontal: 4 },
  suggestionDismissText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  suggestionAdd: { backgroundColor: colors.expected, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  suggestionAddText: { color: '#fff', fontSize: 13, fontWeight: '700' },
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
  addButton: { marginHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  addButtonText: { color: colors.expected, fontSize: 15, fontWeight: '600' },
  continueButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 4,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
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
  repeatsToggle: { flexDirection: 'row', gap: 6 },
  repeatsOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  repeatsOptionSelected: { backgroundColor: colors.expected, borderColor: colors.expected },
  repeatsOptionText: { fontSize: 13, color: colors.text },
  repeatsOptionTextSelected: { color: '#fff', fontWeight: '600' },
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
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancelButton: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  modalAddButton: {
    backgroundColor: colors.expected,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalAddText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
