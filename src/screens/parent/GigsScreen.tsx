// Settings → Gigs. Split out from the old ManageExpectedGigsScreen as part
// of the Settings redesign — its own screen now, reached from a row on the
// Settings list. Keeps its internal list/values sub-tabs, since that
// smaller pattern wasn't part of what the user flagged as not working.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAppData } from '../../context/AppDataContext';
import { Gig, GigEffortTier, GigEffortValues } from '../../types/models';
import { colors } from '../../theme/colors';

const EFFORT_TIERS: { value: GigEffortTier; label: string }[] = [
  { value: 'quick', label: 'Quick' },
  { value: 'medium', label: 'Medium' },
  { value: 'big_job', label: 'Big job' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'GigsSettings'>;
type ModalMode = { editingId: string | null } | null;
type SubTab = 'list' | 'values';
type GigValuesStatus = 'idle' | 'invalid';

export function GigsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { gigs, addGig, updateGig, deleteGig, gigEffortValues, updateGigEffortValues } = useAppData();

  const [subTab, setSubTab] = useState<SubTab>('list');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [draftName, setDraftName] = useState('');
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
    navigation.navigate('Settings');
  };

  const openAdd = () => {
    setDraftName('');
    setDraftEffortTier('quick');
    setModalMode({ editingId: null });
  };

  const openEdit = (gig: Gig) => {
    setDraftName(gig.name);
    setDraftEffortTier(gig.effortTier);
    setModalMode({ editingId: gig.id });
  };

  const confirmSave = () => {
    if (!draftName.trim() || !modalMode) return;
    if (modalMode.editingId) {
      updateGig(modalMode.editingId, { name: draftName.trim(), effortTier: draftEffortTier });
    } else {
      addGig({ name: draftName.trim(), effortTier: draftEffortTier });
    }
    setModalMode(null);
  };

  const confirmDelete = (gig: Gig) => {
    Alert.alert('Remove gig', `Remove "${gig.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteGig(gig.id) },
    ]);
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Gigs" onBack={() => navigation.goBack()} />

      <View style={styles.subTabRow}>
        <Pressable onPress={() => setSubTab('list')} style={styles.subTab}>
          <Text style={[styles.subTabText, subTab === 'list' && styles.subTabTextActive]}>Gigs</Text>
        </Pressable>
        <Pressable onPress={() => setSubTab('values')} style={styles.subTab}>
          <Text style={[styles.subTabText, subTab === 'values' && styles.subTabTextActive]}>Gig values</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        {subTab === 'list' ? (
          <>
            <Text style={styles.helper}>Optional, paid work they choose that builds toward their goal.</Text>

            {gigs.map((gig) => (
              <View key={gig.id} style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{gig.name}</Text>
                  <Text style={styles.rowMeta}>{EFFORT_TIERS.find((t) => t.value === gig.effortTier)?.label}</Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable onPress={() => openEdit(gig)}>
                    <Text style={styles.linkAction}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(gig)}>
                    <Text style={styles.linkActionDanger}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable style={styles.addLink} onPress={openAdd}>
              <Text style={styles.addLinkText}>+ Add gig</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.helper}>
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
            <Pressable style={styles.saveButton} onPress={saveGigValues}>
              <Text style={styles.saveButtonText}>Save gig values</Text>
            </Pressable>
            {gigValuesStatus === 'invalid' && <Text style={styles.errorText}>Enter valid, non-negative amounts.</Text>}
          </>
        )}
      </ScrollView>

      <Modal visible={modalMode !== null} animationType="slide" transparent onRequestClose={() => setModalMode(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalMode(null)}>
            <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
              <Text style={styles.modalTitle}>{modalMode?.editingId ? 'Edit' : 'Add'} gig</Text>
              <TextInput style={styles.input} placeholder="Name" value={draftName} onChangeText={setDraftName} />
              <View style={styles.chipRow}>
                {EFFORT_TIERS.map((tier) => {
                  const selected = draftEffortTier === tier.value;
                  return (
                    <Pressable
                      key={tier.value}
                      onPress={() => setDraftEffortTier(tier.value)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tier.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancelButton} onPress={() => setModalMode(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.modalSaveButton} onPress={confirmSave}>
                  <Text style={styles.modalSaveText}>{modalMode?.editingId ? 'Save' : 'Add'}</Text>
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
  subTabRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 20,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subTab: { paddingBottom: 10 },
  subTabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  subTabTextActive: { color: colors.gigs, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 4 },
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
  helper: { fontSize: 12, color: colors.textMuted, marginBottom: 10, lineHeight: 17 },
  gigValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
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
  saveButton: { marginTop: 12, backgroundColor: colors.gigs, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 10 },
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
