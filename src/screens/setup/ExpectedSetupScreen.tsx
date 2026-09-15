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
import { useSetup, DraftExpectedItem, makeLocalId } from '../../context/SetupContext';
import { getContentLibraryForGrade } from '../../data/contentLibrary';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'ExpectedSetup'>;

export function ExpectedSetupScreen({ navigation }: Props) {
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
        active: true,
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

  const dailyItems = expectedItems.filter((item) => item.frequency === 'daily');
  const weeklyItems = expectedItems.filter((item) => item.frequency === 'weekly');

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Expected"
        step={3}
        totalSteps={4}
        onBack={() => navigation.goBack()}
        childName={childProfile.name}
        childAvatarId={childProfile.avatarId}
        onPressProfile={() => navigation.navigate('ChildProfile')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.introText}>
          Expected is everything that comes with being part of the family — school, chores,
          showing up. It's never paid on purpose: marking these off earns{' '}
          {childProfile.name.trim() || 'your child'} badges for consistency, not money.
        </Text>

        <Text style={styles.helperText}>
          {library
            ? `Suggestions below are typical for ${childProfile.grade} grade. Toggle off what doesn't apply, or add your own.`
            : "We don't have grade-specific suggestions yet — add items below."}
        </Text>

        {dailyItems.length > 0 && (
          <>
            <Text style={styles.subSectionHeader}>Daily</Text>
            {dailyItems.map((item) => (
              <Pressable key={item.localId} style={styles.expectedRow} onPress={() => toggleExpected(item.localId)}>
                <View style={[styles.checkbox, item.active && styles.checkboxChecked]}>
                  {item.active && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={[styles.itemName, !item.active && styles.itemNameInactive]}>{item.name}</Text>
              </Pressable>
            ))}
          </>
        )}
        {weeklyItems.length > 0 && (
          <>
            <Text style={styles.subSectionHeader}>Weekly</Text>
            {weeklyItems.map((item) => (
              <Pressable key={item.localId} style={styles.expectedRow} onPress={() => toggleExpected(item.localId)}>
                <View style={[styles.checkbox, item.active && styles.checkboxChecked]}>
                  {item.active && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={[styles.itemName, !item.active && styles.itemNameInactive]}>{item.name}</Text>
              </Pressable>
            ))}
          </>
        )}
        <Pressable style={styles.addLink} onPress={openAddModal}>
          <Text style={styles.addLinkText}>+ Add custom Expected item</Text>
        </Pressable>
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
            <Text style={styles.modalTitle}>Add Expected item</Text>
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
  itemName: { fontSize: 15, color: colors.text, flexShrink: 1 },
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
  addLink: { paddingVertical: 10 },
  addLinkText: { color: colors.expected, fontSize: 14, fontWeight: '600' },
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
