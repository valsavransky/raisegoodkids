// Settings screen reached via the gear icon on the child home screen —
// there was previously no way to add a gig or change Expected items after
// initial setup at all. Kept off the daily-use Home screen (parent-facing,
// calm/efficient voice) rather than inline, so the kid-facing screen stays
// uncluttered with management controls a child doesn't need to see.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { ExpectedItem, Gig, GigEffortTier, GigEffortValues } from '../../types/models';
import { signOut as signOutOfGoogle } from '../../services/googleAuth';
import { colors } from '../../theme/colors';

const EFFORT_TIERS: { value: GigEffortTier; label: string }[] = [
  { value: 'quick', label: 'Quick' },
  { value: 'medium', label: 'Medium' },
  { value: 'big_job', label: 'Big job' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'ManageExpectedGigs'>;

type ModalMode = { kind: 'expected'; editingId: string | null } | { kind: 'gig'; editingId: string | null } | null;
type TopTab = 'expected' | 'gigs';
type GigsSubTab = 'list' | 'values';
type GigValuesStatus = 'idle' | 'saved' | 'invalid';

export function ManageExpectedGigsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    expectedItems,
    addExpectedItem,
    updateExpectedItem,
    deleteExpectedItem,
    gigs,
    addGig,
    updateGig,
    deleteGig,
    gigEffortValues,
    updateGigEffortValues,
    resetAllData,
  } = useAppData();

  const [topTab, setTopTab] = useState<TopTab>('expected');
  const [gigsSubTab, setGigsSubTab] = useState<GigsSubTab>('list');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [draftName, setDraftName] = useState('');
  const [draftFrequency, setDraftFrequency] = useState<ExpectedItem['frequency']>('daily');
  const [draftEffortTier, setDraftEffortTier] = useState<GigEffortTier>('quick');

  const [gigValueDrafts, setGigValueDrafts] = useState(() => ({
    quick: String(gigEffortValues.quick),
    medium: String(gigEffortValues.medium),
    big_job: String(gigEffortValues.big_job),
  }));
  const [gigValuesStatus, setGigValuesStatus] = useState<GigValuesStatus>('idle');

  const editGigValueDraft = (tier: GigEffortTier, text: string) => {
    setGigValueDrafts((prev) => ({ ...prev, [tier]: text.replace(/[^0-9.]/g, '') }));
    setGigValuesStatus('idle');
  };

  const saveGigValues = () => {
    const parsed: GigEffortValues = {
      quick: parseFloat(gigValueDrafts.quick),
      medium: parseFloat(gigValueDrafts.medium),
      big_job: parseFloat(gigValueDrafts.big_job),
    };
    if (Object.values(parsed).some((v) => Number.isNaN(v) || v < 0)) {
      setGigValuesStatus('invalid');
      return;
    }
    updateGigEffortValues(parsed);
    setGigValuesStatus('saved');
  };

  const openAddExpected = () => {
    setDraftName('');
    setDraftFrequency('daily');
    setModalMode({ kind: 'expected', editingId: null });
  };

  const openEditExpected = (item: ExpectedItem) => {
    setDraftName(item.name);
    setDraftFrequency(item.frequency);
    setModalMode({ kind: 'expected', editingId: item.id });
  };

  const openAddGig = () => {
    setDraftName('');
    setDraftEffortTier('quick');
    setModalMode({ kind: 'gig', editingId: null });
  };

  const openEditGig = (gig: Gig) => {
    setDraftName(gig.name);
    setDraftEffortTier(gig.effortTier);
    setModalMode({ kind: 'gig', editingId: gig.id });
  };

  const confirmSave = () => {
    if (!draftName.trim() || !modalMode) return;
    if (modalMode.kind === 'expected') {
      if (modalMode.editingId) {
        updateExpectedItem(modalMode.editingId, { name: draftName.trim(), frequency: draftFrequency });
      } else {
        addExpectedItem({ name: draftName.trim(), frequency: draftFrequency });
      }
    } else {
      if (modalMode.editingId) {
        updateGig(modalMode.editingId, { name: draftName.trim(), effortTier: draftEffortTier });
      } else {
        addGig({ name: draftName.trim(), effortTier: draftEffortTier });
      }
    }
    setModalMode(null);
  };

  const confirmDeleteExpected = (item: ExpectedItem) => {
    Alert.alert('Remove Expected item', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteExpectedItem(item.id) },
    ]);
  };

  const confirmDeleteGig = (gig: Gig) => {
    Alert.alert('Remove gig', `Remove "${gig.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteGig(gig.id) },
    ]);
  };

  const confirmResetAllData = () => {
    Alert.alert(
      'Reset all data',
      'This deletes everything — the child profile, schedule, Expected items, gigs, goals, badges, and Future Fund balance. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetAllData() },
      ]
    );
  };

  const confirmDisconnectGoogle = () => {
    Alert.alert(
      'Disconnect Google Calendar',
      'Clears the stored Google sign-in so the next calendar import prompts you to connect again. Does not touch schedule events already imported.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => signOutOfGoogle() },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.closeButton}>Close</Text>
        </Pressable>
        <Text style={styles.title}>Expected & Gigs</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setTopTab('expected')}
          style={[styles.tab, topTab === 'expected' && styles.tabActive]}
        >
          <Text style={[styles.tabText, topTab === 'expected' && styles.tabTextActive]}>🔥 Expected</Text>
        </Pressable>
        <Pressable onPress={() => setTopTab('gigs')} style={[styles.tab, topTab === 'gigs' && styles.tabActive]}>
          <Text style={[styles.tabText, topTab === 'gigs' && styles.tabTextActive]}>🪙 Gigs</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {topTab === 'expected' && (
          <>
            {expectedItems.filter((item) => item.frequency === 'daily').length > 0 && (
              <>
                <Text style={styles.subSectionHeader}>Daily</Text>
                {expectedItems
                  .filter((item) => item.frequency === 'daily')
                  .map((item) => (
                    <View key={item.id} style={styles.row}>
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName}>{item.name}</Text>
                      </View>
                      <View style={styles.rowActions}>
                        <Pressable onPress={() => openEditExpected(item)}>
                          <Text style={styles.linkAction}>Edit</Text>
                        </Pressable>
                        <Pressable onPress={() => confirmDeleteExpected(item)}>
                          <Text style={styles.linkActionDanger}>Remove</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
              </>
            )}
            {expectedItems.filter((item) => item.frequency === 'weekly').length > 0 && (
              <>
                <Text style={styles.subSectionHeader}>Weekly</Text>
                {expectedItems
                  .filter((item) => item.frequency === 'weekly')
                  .map((item) => (
                    <View key={item.id} style={styles.row}>
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName}>{item.name}</Text>
                      </View>
                      <View style={styles.rowActions}>
                        <Pressable onPress={() => openEditExpected(item)}>
                          <Text style={styles.linkAction}>Edit</Text>
                        </Pressable>
                        <Pressable onPress={() => confirmDeleteExpected(item)}>
                          <Text style={styles.linkActionDanger}>Remove</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
              </>
            )}
            <Pressable style={styles.addLink} onPress={openAddExpected}>
              <Text style={styles.addLinkText}>+ Add Expected item</Text>
            </Pressable>
          </>
        )}

        {topTab === 'gigs' && (
          <>
            <View style={styles.subTabRow}>
              <Pressable onPress={() => setGigsSubTab('list')} style={styles.subTab}>
                <Text style={[styles.subTabText, gigsSubTab === 'list' && styles.subTabTextActive]}>Gigs</Text>
              </Pressable>
              <Pressable onPress={() => setGigsSubTab('values')} style={styles.subTab}>
                <Text style={[styles.subTabText, gigsSubTab === 'values' && styles.subTabTextActive]}>
                  Gig values
                </Text>
              </Pressable>
            </View>

            {gigsSubTab === 'list' ? (
              <>
                {gigs.map((gig) => (
                  <View key={gig.id} style={styles.row}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{gig.name}</Text>
                      <Text style={styles.rowMeta}>{EFFORT_TIERS.find((t) => t.value === gig.effortTier)?.label}</Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Pressable onPress={() => openEditGig(gig)}>
                        <Text style={styles.linkAction}>Edit</Text>
                      </Pressable>
                      <Pressable onPress={() => confirmDeleteGig(gig)}>
                        <Text style={styles.linkActionDanger}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
                <Pressable style={styles.addLink} onPress={openAddGig}>
                  <Text style={styles.addLinkText}>+ Add gig</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.gigValuesHelper}>
                  How much each effort tier is worth — this determines how much goal progress a gig earns.
                </Text>
                {EFFORT_TIERS.map((tier) => (
                  <View key={tier.value} style={styles.gigValueRow}>
                    <Text style={styles.gigValueLabel}>{tier.label}</Text>
                    <View style={styles.gigValueInputWrap}>
                      <Text style={styles.gigValueDollarSign}>$</Text>
                      <TextInput
                        style={styles.gigValueInput}
                        keyboardType="decimal-pad"
                        value={gigValueDrafts[tier.value]}
                        onChangeText={(text) => editGigValueDraft(tier.value, text)}
                      />
                    </View>
                  </View>
                ))}
                <Pressable style={styles.saveGigValuesButton} onPress={saveGigValues}>
                  <Text style={styles.saveGigValuesButtonText}>Save gig values</Text>
                </Pressable>
                {gigValuesStatus === 'saved' && <Text style={styles.gigValuesSavedText}>✓ Saved</Text>}
                {gigValuesStatus === 'invalid' && (
                  <Text style={styles.gigValuesErrorText}>Enter valid, non-negative amounts.</Text>
                )}
              </>
            )}
          </>
        )}

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneLabel}>Testing</Text>
          <Pressable style={styles.resetButton} onPress={confirmDisconnectGoogle}>
            <Text style={styles.resetButtonText}>Disconnect Google Calendar</Text>
          </Pressable>
          <Pressable style={[styles.resetButton, styles.resetButtonSpaced]} onPress={confirmResetAllData}>
            <Text style={styles.resetButtonText}>Reset all data</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={modalMode !== null} animationType="slide" transparent onRequestClose={() => setModalMode(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]}>
            <Text style={styles.modalTitle}>
              {modalMode?.editingId ? 'Edit' : 'Add'} {modalMode?.kind === 'expected' ? 'Expected item' : 'gig'}
            </Text>
            <TextInput style={styles.input} placeholder="Name" value={draftName} onChangeText={setDraftName} />
            {modalMode?.kind === 'expected' ? (
              <View style={styles.chipRow}>
                {(['daily', 'weekly'] as const).map((freq) => {
                  const selected = draftFrequency === freq;
                  return (
                    <Pressable key={freq} onPress={() => setDraftFrequency(freq)} style={[styles.chip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{freq === 'daily' ? 'Daily' : 'Weekly'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.chipRow}>
                {EFFORT_TIERS.map((tier) => {
                  const selected = draftEffortTier === tier.value;
                  return (
                    <Pressable key={tier.value} onPress={() => setDraftEffortTier(tier.value)} style={[styles.chip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tier.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setModalMode(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={confirmSave}>
                <Text style={styles.modalSaveText}>{modalMode?.editingId ? 'Save' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  closeButton: { fontSize: 15, color: colors.textMuted, width: 44 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 4 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.text, borderColor: colors.text },
  tabText: { fontSize: 14, fontWeight: '700', color: colors.text },
  tabTextActive: { color: '#fff' },
  subTabRow: { flexDirection: 'row', gap: 20, marginBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  subTab: { paddingBottom: 10 },
  subTabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  subTabTextActive: { color: colors.gigs, fontWeight: '700' },
  subSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 6,
  },
  row: {
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
  rowInfo: { flexShrink: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 14 },
  linkAction: { color: colors.expected, fontSize: 13, fontWeight: '700' },
  linkActionDanger: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  addLink: { paddingVertical: 10 },
  addLinkText: { color: colors.expected, fontSize: 14, fontWeight: '600' },
  gigValuesHelper: { fontSize: 12, color: colors.textMuted, marginBottom: 10, lineHeight: 17 },
  gigValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  gigValueLabel: { fontSize: 15, color: colors.text },
  gigValueInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
  },
  gigValueDollarSign: { fontSize: 15, color: colors.textMuted, marginRight: 2 },
  gigValueInput: { fontSize: 15, color: colors.text, paddingVertical: 8, width: 56, textAlign: 'right' },
  saveGigValuesButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.gigs,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveGigValuesButtonText: { color: colors.gigs, fontSize: 14, fontWeight: '700' },
  gigValuesSavedText: { color: colors.success, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  gigValuesErrorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  dangerZone: { marginTop: 36, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  dangerZoneLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  resetButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  resetButtonSpaced: { marginTop: 10 },
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
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.expected, borderColor: colors.expected },
  chipText: { fontSize: 12, color: colors.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalCancelButton: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  modalSaveButton: { backgroundColor: colors.expected, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
