// Screen 6: parent setup, step 2 of 3 (continued) — schedule review/tagging.
// The convergence point for both the "connect calendar" and "skip" paths
// from screen 5; today only the skip path feeds events in (manually added
// here), since calendar import isn't wired up yet.
//
// Manual entry uses structured fields (name, day(s)/date, start/end time,
// whether it repeats) rather than a single free-form recurrence string, so
// events can later be rendered as a real schedule view.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ScrollView, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup, DraftScheduleEvent, makeLocalId } from '../../context/SetupContext';
import { ScheduleEventCategory, CADENCE_LABELS } from '../../types/models';
import {
  categoryTriggersSuggestion,
  suggestExpectedItemForEvent,
  placeholderForCategory,
} from '../../data/practiceSuggestions';
import { colors } from '../../theme/colors';

const CATEGORIES: { value: ScheduleEventCategory; label: string }[] = [
  { value: 'school', label: 'School' },
  { value: 'sports', label: 'Sports' },
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'music', label: 'Music' },
  { value: 'other', label: 'Other' },
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
  const insets = useSafeAreaInsets();
  const { childProfile, scheduleEvents, setScheduleEvents, expectedItems, setExpectedItems } = useSetup();
  const [suggestionStatus, setSuggestionStatus] = useState<Record<string, SuggestionStatus>>({});
  const [addedSuggestionNames, setAddedSuggestionNames] = useState<Record<string, string>>({});
  const [genericSuggestionDrafts, setGenericSuggestionDrafts] = useState<Record<string, string>>({});
  const [suggestionFrequency, setSuggestionFrequency] = useState<Record<string, 'daily' | 'weekly'>>({});
  const [suggestionDuration, setSuggestionDuration] = useState<Record<string, string>>({});
  // Only meaningful for events tagged 'sports' — whether this particular
  // commitment is a practice (worth a suggested Expected item) or a game
  // (a one-off event, not a daily/weekly habit). Not persisted on the
  // event itself since it only ever affects whether a suggestion shows.
  const [sportsIsPractice, setSportsIsPractice] = useState<Record<string, boolean>>({});
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
  // right here, not a separate screen. The cadence (frequency + duration)
  // is folded into the item's name for now (e.g. "Practice Piano (20
  // min/day)") rather than a new ExpectedItem field, since it's just
  // descriptive text the parent set, not something the app needs to act on
  // structurally yet.
  const acceptSuggestion = (
    name: string,
    localId: string,
    frequency: 'daily' | 'weekly' = 'daily',
    durationMinutes?: number
  ) => {
    if (!name.trim()) return;
    const finalName =
      durationMinutes && durationMinutes > 0
        ? `${name.trim()} (${durationMinutes} min/${frequency === 'daily' ? 'day' : 'week'})`
        : name.trim();
    setExpectedItems([
      ...expectedItems,
      { localId: makeLocalId('expected'), name: finalName, frequency, active: true },
    ]);
    setSuggestionStatus((prev) => ({ ...prev, [localId]: 'added' }));
    setAddedSuggestionNames((prev) => ({ ...prev, [localId]: finalName }));
  };

  const dismissSuggestion = (localId: string) => {
    setSuggestionStatus((prev) => ({ ...prev, [localId]: 'dismissed' }));
  };

  // Shared by both the keyword-matched and generic suggestion cards — every
  // suggestion gets the same daily/weekly + duration picker, since a school
  // event's homework can be a daily habit or a once-a-week one just as much
  // as a practice-keyword match can.
  const renderCadenceRow = (localId: string, freq: 'daily' | 'weekly', duration: string) => (
    <View style={styles.cadenceRow}>
      <Pressable
        onPress={() => setSuggestionFrequency((prev) => ({ ...prev, [localId]: 'daily' }))}
        style={[styles.cadenceChip, freq === 'daily' && styles.cadenceChipSelected]}
      >
        <Text style={[styles.cadenceChipText, freq === 'daily' && styles.cadenceChipTextSelected]}>Daily</Text>
      </Pressable>
      <Pressable
        onPress={() => setSuggestionFrequency((prev) => ({ ...prev, [localId]: 'weekly' }))}
        style={[styles.cadenceChip, freq === 'weekly' && styles.cadenceChipSelected]}
      >
        <Text style={[styles.cadenceChipText, freq === 'weekly' && styles.cadenceChipTextSelected]}>Weekly</Text>
      </Pressable>
      <TextInput
        style={styles.durationInput}
        keyboardType="number-pad"
        value={duration}
        onChangeText={(text) =>
          setSuggestionDuration((prev) => ({ ...prev, [localId]: text.replace(/[^0-9]/g, '') }))
        }
      />
      <Text style={styles.cadenceUnit}>min/{freq === 'daily' ? 'day' : 'week'}</Text>
    </View>
  );

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
      cadence: draftRecurring ? 'weekly' : undefined,
      date: draftRecurring ? undefined : draftDate.trim(),
      startTime: draftStartTime.trim() || undefined,
      endTime: draftEndTime.trim() || undefined,
    };
    setScheduleEvents([...scheduleEvents, event]);
    setModalVisible(false);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Review schedule"
        step={2}
        totalSteps={4}
        onBack={() => navigation.goBack()}
        childName={childProfile.name}
        childAvatarId={childProfile.avatarId}
        onPressProfile={() => navigation.navigate('ChildProfile')}
      />

      <Text style={styles.helperText}>Anything not tagged counts as free time for gigs.</Text>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={scheduleEvents}
        keyExtractor={(event) => event.localId}
        ListEmptyComponent={<Text style={styles.emptyText}>No events yet — add anything worth knowing about.</Text>}
        renderItem={({ item }) => {
          const status = suggestionStatus[item.localId] ?? 'pending';
          const showSuggestion =
            status === 'pending' && categoryTriggersSuggestion(item.category, sportsIsPractice[item.localId]);
          const suggestion = showSuggestion ? suggestExpectedItemForEvent(item.title, item.category) : null;

          return (
            <View style={styles.eventRow}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <View style={styles.eventMetaRow}>
                  {item.recurring && (
                    <View style={styles.cadenceTag}>
                      <Text style={styles.cadenceTagText}>{CADENCE_LABELS[item.cadence ?? 'weekly']}</Text>
                    </View>
                  )}
                  <Text style={styles.eventRecurrence}>{describeSchedule(item)}</Text>
                </View>
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

              {item.category === 'sports' && (
                <View style={styles.sportsTypeRow}>
                  <Text style={styles.sportsTypeLabel}>Practice or game?</Text>
                  <View style={styles.categoryRow}>
                    <Pressable
                      onPress={() => setSportsIsPractice((prev) => ({ ...prev, [item.localId]: true }))}
                      style={[styles.categoryChip, sportsIsPractice[item.localId] === true && styles.categoryChipSelected]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          sportsIsPractice[item.localId] === true && styles.categoryChipTextSelected,
                        ]}
                      >
                        Practice
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSportsIsPractice((prev) => ({ ...prev, [item.localId]: false }))}
                      style={[styles.categoryChip, sportsIsPractice[item.localId] === false && styles.categoryChipSelected]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          sportsIsPractice[item.localId] === false && styles.categoryChipTextSelected,
                        ]}
                      >
                        Game
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {status === 'added' && (
                <View style={styles.suggestionAddedCard}>
                  <Text style={styles.suggestionAddedIcon}>✓</Text>
                  <Text style={styles.suggestionAddedText}>
                    Added <Text style={styles.suggestionName}>"{addedSuggestionNames[item.localId]}"</Text> to
                    Expected
                  </Text>
                </View>
              )}

              {suggestion && !suggestion.isGeneric && (() => {
                const freq = suggestionFrequency[item.localId] ?? suggestion.defaultFrequency;
                const duration = suggestionDuration[item.localId] ?? String(suggestion.defaultDurationMinutes);
                return (
                  <View style={styles.suggestionCard}>
                    <Text style={styles.suggestionText}>
                      Add <Text style={styles.suggestionName}>"{suggestion.name}"</Text> to Expected?
                    </Text>
                    {renderCadenceRow(item.localId, freq, duration)}
                    <View style={styles.suggestionActions}>
                      <Pressable onPress={() => dismissSuggestion(item.localId)} style={styles.suggestionDismiss}>
                        <Text style={styles.suggestionDismissText}>No thanks</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => acceptSuggestion(suggestion.name, item.localId, freq, Number(duration) || 0)}
                        style={styles.suggestionAdd}
                      >
                        <Text style={styles.suggestionAddText}>Add</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })()}

              {suggestion && suggestion.isGeneric && (() => {
                const freq = suggestionFrequency[item.localId] ?? 'daily';
                const duration = suggestionDuration[item.localId] ?? '';
                return (
                  <View style={styles.suggestionCard}>
                    <Text style={styles.suggestionText}>
                      Add a related Expected item for "{item.title}"?
                    </Text>
                    <TextInput
                      style={styles.suggestionInput}
                      placeholder={placeholderForCategory(item.category)}
                      value={genericSuggestionDrafts[item.localId] ?? ''}
                      onChangeText={(text) =>
                        setGenericSuggestionDrafts((prev) => ({ ...prev, [item.localId]: text }))
                      }
                    />
                    {renderCadenceRow(item.localId, freq, duration)}
                    <View style={styles.suggestionActions}>
                      <Pressable onPress={() => dismissSuggestion(item.localId)} style={styles.suggestionDismiss}>
                        <Text style={styles.suggestionDismissText}>No thanks</Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          acceptSuggestion(
                            genericSuggestionDrafts[item.localId] ?? '',
                            item.localId,
                            freq,
                            Number(duration) || 0
                          )
                        }
                        style={styles.suggestionAdd}
                      >
                        <Text style={styles.suggestionAddText}>Add</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })()}
            </View>
          );
        }}
      />

      <Pressable style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>+ Add event manually</Text>
      </Pressable>

      <Pressable
        style={[styles.continueButton, { marginBottom: 20 + insets.bottom }]}
        onPress={() => navigation.navigate('ExpectedSetup')}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  eventRecurrence: { fontSize: 13, color: colors.textMuted },
  cadenceTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cadenceTagText: { fontSize: 11, color: colors.expected, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  sportsTypeRow: { marginBottom: 12 },
  sportsTypeLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 6 },
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
  suggestionAddedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.expected,
    padding: 12,
    marginTop: -2,
    marginBottom: 4,
  },
  suggestionAddedIcon: { fontSize: 14, color: colors.expected, fontWeight: '700' },
  suggestionAddedText: { fontSize: 13, color: colors.text, flexShrink: 1 },
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
  cadenceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  cadenceChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cadenceChipSelected: { backgroundColor: colors.expected, borderColor: colors.expected },
  cadenceChipText: { fontSize: 12, color: colors.text },
  cadenceChipTextSelected: { color: '#fff', fontWeight: '600' },
  durationInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    width: 48,
    textAlign: 'center',
  },
  cadenceUnit: { fontSize: 12, color: colors.textMuted },
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
    maxHeight: '85%',
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
