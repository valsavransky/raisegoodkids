// Settings → Expected Items. Split out from the old ManageExpectedGigsScreen
// (which crammed Expected/Gigs/Account into tabs) as part of the Settings
// redesign — now its own screen, reached from a row on the Settings list.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAppData } from '../../context/AppDataContext';
import { ExpectedItem } from '../../types/models';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpectedItemsSettings'>;

type ModalMode = { editingId: string | null } | null;

export function ExpectedItemsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { expectedItems, addExpectedItem, updateExpectedItem, deleteExpectedItem } = useAppData();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [draftName, setDraftName] = useState('');
  const [draftFrequency, setDraftFrequency] = useState<ExpectedItem['frequency']>('daily');

  const openAdd = () => {
    setDraftName('');
    setDraftFrequency('daily');
    setModalMode({ editingId: null });
  };

  const openEdit = (item: ExpectedItem) => {
    setDraftName(item.name);
    setDraftFrequency(item.frequency);
    setModalMode({ editingId: item.id });
  };

  const confirmSave = () => {
    if (!draftName.trim() || !modalMode) return;
    if (modalMode.editingId) {
      updateExpectedItem(modalMode.editingId, { name: draftName.trim(), frequency: draftFrequency });
    } else {
      addExpectedItem({ name: draftName.trim(), frequency: draftFrequency });
    }
    setModalMode(null);
  };

  const confirmDelete = (item: ExpectedItem) => {
    Alert.alert('Remove Expected item', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteExpectedItem(item.id) },
    ]);
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Expected Items" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        <Text style={styles.helper}>
          Unpaid, non-negotiable responsibilities that come with being part of the family.
        </Text>

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
                    <Pressable onPress={() => openEdit(item)}>
                      <Text style={styles.linkAction}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(item)}>
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
                    <Pressable onPress={() => openEdit(item)}>
                      <Text style={styles.linkAction}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(item)}>
                      <Text style={styles.linkActionDanger}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
          </>
        )}
        <Pressable style={styles.addLink} onPress={openAdd}>
          <Text style={styles.addLinkText}>+ Add Expected item</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={modalMode !== null} animationType="slide" transparent onRequestClose={() => setModalMode(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalMode(null)}>
            <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
              <Text style={styles.modalTitle}>{modalMode?.editingId ? 'Edit' : 'Add'} Expected item</Text>
              <TextInput style={styles.input} placeholder="Name" value={draftName} onChangeText={setDraftName} />
              <View style={styles.chipRow}>
                {(['daily', 'weekly'] as const).map((freq) => {
                  const selected = draftFrequency === freq;
                  return (
                    <Pressable
                      key={freq}
                      onPress={() => setDraftFrequency(freq)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {freq === 'daily' ? 'Daily' : 'Weekly'}
                      </Text>
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
  content: { paddingHorizontal: 20, paddingTop: 8 },
  helper: { fontSize: 12, color: colors.textMuted, marginBottom: 14, lineHeight: 17 },
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
  rowActions: { flexDirection: 'row', gap: 14 },
  linkAction: { color: colors.expected, fontSize: 13, fontWeight: '700' },
  linkActionDanger: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  addLink: { paddingVertical: 10 },
  addLinkText: { color: colors.expected, fontSize: 14, fontWeight: '600' },
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
