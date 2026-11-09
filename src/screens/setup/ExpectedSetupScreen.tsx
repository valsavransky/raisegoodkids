// Screen 7a: parent setup, step 3 of 4 — Expected items. Split out from what
// used to be a single combined Expected+Gigs screen: Expected items are
// unpaid daily/weekly responsibilities and Gigs are paid work toward a goal
// — different enough concepts that reviewing them one at a time (rather
// than scrolling past one to get to the other) keeps each screen focused.
//
// No per-item excusable/always-required toggle here — v1 scope ships a
// single all-or-nothing daily excuse instead (see DailyExcuse in the data
// model and docs/screens-and-flows.md's v1 scope note on screen 7).
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AddPill } from '../../components/AddPill';
import { useSetup, DraftExpectedItem, makeLocalId } from '../../context/SetupContext';
import { getContentLibraryForGrade, getMoreIdeaNames, isStarterExpected } from '../../data/contentLibrary';
import { GradeBanner, SectionLabel, MoreIdeas, FrequencyTag } from '../../components/SetupSuggestionParts';
import { useTrackSetupStep } from '../../hooks/useTrackScreen';
import { colors } from '../../theme/colors';
import { childFirstName, gradeName } from '../../utils/setupCopy';

type Props = NativeStackScreenProps<SetupStackParamList, 'ExpectedSetup'>;

export function ExpectedSetupScreen({ navigation }: Props) {
  useTrackSetupStep('expected');
  const insets = useSafeAreaInsets();
  const { childProfile, expectedItems, setExpectedItems } = useSetup();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftFrequency, setDraftFrequency] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    // Merge content-library suggestions in alongside anything already
    // present — calendar import (see GoogleCalendarEventsScreen) may have
    // already seeded some Expected items before this screen is reached.
    // Dedup by name so re-mounting this screen (e.g. going back and forward
    // through the wizard) doesn't double up what's already there.
    const library = getContentLibraryForGrade(childProfile.grade);
    const existingNames = new Set(expectedItems.map((item) => item.name));
    const suggestions: { name: string; frequency: 'daily' | 'weekly' }[] = [
      ...(library?.expectedItems ?? []),
      // A pet is a daily responsibility a child can own directly, unlike a
      // yard or car (which usually stay Gigs — see GigsSetupScreen).
      ...(childProfile.hasPet
        ? [{ name: `Feed ${childProfile.petName?.trim() || 'the pet'}`, frequency: 'daily' as const }]
        : []),
    ];
    const newItems = suggestions
      .filter((item) => !existingNames.has(item.name))
      .map((item) => ({
        localId: makeLocalId('expected'),
        name: item.name,
        frequency: item.frequency,
        // Only the starter set starts checked; the rest wait under "More ideas".
        active: isStarterExpected(childProfile.grade, item.name),
      }));
    if (newItems.length > 0) {
      setExpectedItems([...expectedItems, ...newItems]);
    }
    // Only run once, on mount, to seed suggestions — not on every keystroke elsewhere in context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const library = getContentLibraryForGrade(childProfile.grade);

  const toggleExpected = (localId: string) => {
    setExpectedItems(
      expectedItems.map((item) => (item.localId === localId ? { ...item, active: !item.active } : item))
    );
  };

  const openAddModal = () => {
    setDraftName('');
    setDraftFrequency('daily');
    setAddModalVisible(true);
  };

  const confirmAdd = () => {
    if (!draftName.trim()) return;
    const item: DraftExpectedItem = {
      localId: makeLocalId('expected'),
      name: draftName.trim(),
      frequency: draftFrequency,
      active: true,
    };
    setExpectedItems([...expectedItems, item]);
    setAddModalVisible(false);
  };

  // Library suggestions outside the starter set stay tucked under "More ideas"
  // until the parent checks one; once checked, it moves up into the chosen list.
  const moreNames = getMoreIdeaNames(childProfile.grade).expected;
  const isMore = (item: DraftExpectedItem) => moreNames.has(item.name) && !item.active;
  const moreItems = expectedItems.filter(isMore);
  const chosen = expectedItems.filter((item) => !isMore(item));
  const chosenDaily = chosen.filter((item) => item.frequency === 'daily');
  const chosenWeekly = chosen.filter((item) => item.frequency === 'weekly');
  const chosenCount = chosen.filter((item) => item.active).length;

  const renderRow = (item: DraftExpectedItem) => (
    <Pressable key={item.localId} style={styles.expectedRow} onPress={() => toggleExpected(item.localId)}>
      <View style={[styles.checkbox, item.active && styles.checkboxChecked]}>
        {item.active && <Text style={styles.checkboxMark}>✓</Text>}
      </View>
      <Text style={[styles.itemName, !item.active && !isMore(item) && styles.itemNameInactive]}>{item.name}</Text>
      <FrequencyTag frequency={item.frequency} />
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Expected"
        step={3}
        totalSteps={6}
        onBack={() => navigation.goBack()}
        childName={childProfile.name}
        childAvatarId={childProfile.avatarId}
        onPressProfile={() => navigation.navigate('ChildProfile')}
        action={<AddPill onPress={openAddModal} />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {library && childProfile.grade ? (
          <GradeBanner
            childName={childFirstName(childProfile.name)}
            gradeText={gradeName(childProfile.grade)}
            onChange={() => navigation.navigate('ChildProfile')}
          />
        ) : null}

        <Text style={styles.introText}>
          Expected activities are everyday responsibilities for being part of the family. They aren't paid. Start with a
          few. You can add more any time.
        </Text>
        {!(library && childProfile.grade) && (
          <Text style={styles.helperText}>We don't have grade-specific suggestions yet. Add items with + Add.</Text>
        )}

        <SectionLabel title="Chosen" note={`${chosenCount} chosen`} />
        {chosenDaily.length > 0 && <Text style={styles.subSectionHeader}>Daily</Text>}
        {chosenDaily.map(renderRow)}
        {chosenWeekly.length > 0 && <Text style={styles.subSectionHeader}>Weekly</Text>}
        {chosenWeekly.map(renderRow)}

        {library && childProfile.grade ? (
          <MoreIdeas gradeText={gradeName(childProfile.grade)} count={moreItems.length}>
            {moreItems.map(renderRow)}
          </MoreIdeas>
        ) : null}
      </ScrollView>

      <Pressable
        style={[styles.continueButton, { marginBottom: 20 + insets.bottom }]}
        onPress={() => navigation.navigate('GigsSetup')}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>

      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAddModalVisible(false)}>
          <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
            <Text style={styles.modalTitle}>Add Expected activity</Text>
            <TextInput style={styles.input} placeholder="Name" value={draftName} onChangeText={setDraftName} />
            <View style={styles.effortRow}>
              {(['daily', 'weekly'] as const).map((freq) => {
                const selected = draftFrequency === freq;
                return (
                  <Pressable
                    key={freq}
                    onPress={() => setDraftFrequency(freq)}
                    style={[styles.effortChip, selected && styles.effortChipSelected]}
                  >
                    <Text style={[styles.effortChipText, selected && styles.effortChipTextSelected]}>
                      {freq === 'daily' ? 'Daily' : 'Weekly'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalAddButton} onPress={confirmAdd}>
                <Text style={styles.modalAddText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 12 },
  introText: { fontSize: 14, color: colors.text, marginBottom: 14, lineHeight: 20 },
  helperText: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 19 },
  subSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 2,
  },
  expectedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
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
  itemName: { fontSize: 15, color: colors.text, flex: 1 },
  itemNameInactive: { color: colors.textMuted, textDecorationLine: 'line-through' },
  effortRow: { flexDirection: 'row', gap: 6, marginLeft: 0, marginBottom: 4 },
  effortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  effortChipSelected: { backgroundColor: colors.expected, borderColor: colors.expected },
  effortChipText: { fontSize: 12, color: colors.text },
  effortChipTextSelected: { color: '#fff', fontWeight: '600' },
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
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
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
