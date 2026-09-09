// Screen 7: parent setup, step 3 of 3 — Expected & Gigs setup.
//
// No per-item excusable/always-required toggle here — v1 scope ships a
// single all-or-nothing daily excuse instead (see DailyExcuse in the data
// model and docs/screens-and-flows.md's v1 scope note on screen 7).
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup, DraftExpectedItem, DraftGig, makeLocalId } from '../../context/SetupContext';
import { useAppData } from '../../context/AppDataContext';
import { getContentLibraryForGrade } from '../../data/contentLibrary';
import { GigEffortTier } from '../../types/models';
import { colors } from '../../theme/colors';

const EFFORT_TIERS: { value: GigEffortTier; label: string }[] = [
  { value: 'quick', label: 'Quick' },
  { value: 'medium', label: 'Medium' },
  { value: 'big_job', label: 'Big job' },
];

type Props = NativeStackScreenProps<SetupStackParamList, 'ExpectedGigsSetup'>;

export function ExpectedGigsSetupScreen({ navigation }: Props) {
  const setup = useSetup();
  const { childProfile, expectedItems, setExpectedItems, gigs, setGigs } = setup;
  const { completeSetup } = useAppData();
  const [addModalMode, setAddModalMode] = useState<'expected' | 'gig' | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftFrequency, setDraftFrequency] = useState<'daily' | 'weekly'>('daily');
  const [draftEffortTier, setDraftEffortTier] = useState<GigEffortTier>('quick');

  useEffect(() => {
    // KNOWN ISSUE (deferred until real Google Calendar integration): if
    // calendar import already seeded expectedItems (see
    // GoogleCalendarEventsScreen), this bails out and content-library
    // suggestions — both Expected items and Gigs — never get added, even
    // though Gigs has nothing to do with calendar import. Fix by tracking
    // "library already applied" separately from "list is non-empty".
    if (expectedItems.length > 0 || gigs.length > 0) return;
    const library = getContentLibraryForGrade(childProfile.grade);
    if (!library) return;
    setExpectedItems(
      library.expectedItems.map((item) => ({
        localId: makeLocalId('expected'),
        name: item.name,
        frequency: item.frequency,
        active: true,
      }))
    );
    setGigs(
      library.gigs.map((gig) => ({
        localId: makeLocalId('gig'),
        name: gig.name,
        effortTier: gig.effortTier,
        active: true,
      }))
    );
    // Only run once, on mount, to seed suggestions — not on every keystroke elsewhere in context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const library = getContentLibraryForGrade(childProfile.grade);

  const toggleExpected = (localId: string) => {
    setExpectedItems(
      expectedItems.map((item) => (item.localId === localId ? { ...item, active: !item.active } : item))
    );
  };

  const toggleGig = (localId: string) => {
    setGigs(gigs.map((gig) => (gig.localId === localId ? { ...gig, active: !gig.active } : gig)));
  };

  const setGigEffortTier = (localId: string, effortTier: GigEffortTier) => {
    setGigs(gigs.map((gig) => (gig.localId === localId ? { ...gig, effortTier } : gig)));
  };

  const openAddModal = (mode: 'expected' | 'gig') => {
    setDraftName('');
    setDraftFrequency('daily');
    setDraftEffortTier('quick');
    setAddModalMode(mode);
  };

  const confirmAdd = () => {
    if (!draftName.trim()) return;
    if (addModalMode === 'expected') {
      const item: DraftExpectedItem = {
        localId: makeLocalId('expected'),
        name: draftName.trim(),
        frequency: draftFrequency,
        active: true,
      };
      setExpectedItems([...expectedItems, item]);
    } else if (addModalMode === 'gig') {
      const gig: DraftGig = {
        localId: makeLocalId('gig'),
        name: draftName.trim(),
        effortTier: draftEffortTier,
        active: true,
      };
      setGigs([...gigs, gig]);
    }
    setAddModalMode(null);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Expected and gigs" step={3} totalSteps={3} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.helperText}>
          {library
            ? `Suggestions below are typical for ${childProfile.grade} grade. Toggle off what doesn't apply, or add your own.`
            : "We don't have grade-specific suggestions yet — add items below."}
        </Text>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionIcon, { color: colors.expected }]}>🔥</Text>
          <Text style={styles.sectionHeader}>Expected</Text>
        </View>
        {expectedItems.map((item) => (
          <Pressable key={item.localId} style={styles.expectedRow} onPress={() => toggleExpected(item.localId)}>
            <View style={[styles.checkbox, item.active && styles.checkboxChecked]}>
              {item.active && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={[styles.itemName, !item.active && styles.itemNameInactive]}>{item.name}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.addLink} onPress={() => openAddModal('expected')}>
          <Text style={styles.addLinkText}>+ Add custom Expected item</Text>
        </Pressable>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionIcon, { color: colors.gigs }]}>🪙</Text>
          <Text style={styles.sectionHeader}>Gigs</Text>
        </View>
        {gigs.map((gig) => (
          <View key={gig.localId} style={styles.gigRow}>
            <Pressable style={styles.gigCheckboxRow} onPress={() => toggleGig(gig.localId)}>
              <View style={[styles.checkbox, gig.active && styles.checkboxChecked]}>
                {gig.active && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={[styles.itemName, !gig.active && styles.itemNameInactive]}>{gig.name}</Text>
            </Pressable>
            <View style={styles.effortRow}>
              {EFFORT_TIERS.map((tier) => {
                const selected = gig.effortTier === tier.value;
                return (
                  <Pressable
                    key={tier.value}
                    onPress={() => setGigEffortTier(gig.localId, tier.value)}
                    style={[styles.effortChip, selected && styles.effortChipSelected]}
                  >
                    <Text style={[styles.effortChipText, selected && styles.effortChipTextSelected]}>
                      {tier.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <Pressable style={styles.addLink} onPress={() => openAddModal('gig')}>
          <Text style={styles.addLinkText}>+ Add custom gig</Text>
        </Pressable>
      </ScrollView>

      <Pressable
        style={styles.finishButton}
        onPress={() =>
          completeSetup({
            childProfile: setup.childProfile,
            scheduleEvents: setup.scheduleEvents,
            expectedItems: setup.expectedItems,
            gigs: setup.gigs,
          })
        }
      >
        <Text style={styles.finishButtonText}>Finish setup</Text>
      </Pressable>

      <Modal visible={addModalMode !== null} animationType="slide" transparent onRequestClose={() => setAddModalMode(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {addModalMode === 'expected' ? 'Add Expected item' : 'Add gig'}
            </Text>
            <TextInput style={styles.input} placeholder="Name" value={draftName} onChangeText={setDraftName} />
            {addModalMode === 'expected' ? (
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
            ) : (
              <View style={styles.effortRow}>
                {EFFORT_TIERS.map((tier) => {
                  const selected = draftEffortTier === tier.value;
                  return (
                    <Pressable
                      key={tier.value}
                      onPress={() => setDraftEffortTier(tier.value)}
                      style={[styles.effortChip, selected && styles.effortChipSelected]}
                    >
                      <Text style={[styles.effortChipText, selected && styles.effortChipTextSelected]}>
                        {tier.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setAddModalMode(null)}>
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
  content: { paddingHorizontal: 20, paddingBottom: 12 },
  helperText: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 19 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10, gap: 8 },
  sectionIcon: { fontSize: 16 },
  sectionHeader: { fontSize: 17, fontWeight: '700', color: colors.text },
  expectedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  gigRow: { paddingVertical: 10, gap: 8 },
  gigCheckboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  effortRow: { flexDirection: 'row', gap: 6, marginLeft: 34 },
  effortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  effortChipSelected: { backgroundColor: colors.gigs, borderColor: colors.gigs },
  effortChipText: { fontSize: 12, color: colors.text },
  effortChipTextSelected: { color: '#fff', fontWeight: '600' },
  addLink: { paddingVertical: 10 },
  addLinkText: { color: colors.expected, fontSize: 14, fontWeight: '600' },
  finishButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 4,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
