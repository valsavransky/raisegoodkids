// Settings → Expected Items. Split out from the old ManageExpectedGigsScreen
// (which crammed Expected/Gigs/Account into tabs) as part of the Settings
// redesign — now its own screen, reached from a row on the Settings list.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, Switch, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ChildSettingsHeader } from '../../components/ChildSettingsHeader';
import { DraggableList } from '../../components/DraggableList';
import { useAppData } from '../../context/AppDataContext';
import { ExpectedItem } from '../../types/models';
import { isItemExcusable } from '../../utils/excuse';
import { colors } from '../../theme/colors';
import { LINK_HIT_SLOP } from '../../theme/hitSlop';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpectedItemsSettings'>;

type ModalMode = { editingId: string | null } | null;

export function ExpectedItemsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { expectedItems, addExpectedItem, updateExpectedItem, deleteExpectedItem, setExpectedOrder, setItemExcusable } = useAppData();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [dragging, setDragging] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftFrequency, setDraftFrequency] = useState<ExpectedItem['frequency']>('daily');
  // True when the activity stays on the list on a sick day, trip or birthday.
  const [draftRequired, setDraftRequired] = useState(false);

  const openAdd = () => {
    setDraftName('');
    setDraftFrequency('daily');
    setDraftRequired(false);
    setModalMode({ editingId: null });
  };

  const openEdit = (item: ExpectedItem) => {
    setDraftName(item.name);
    setDraftFrequency(item.frequency);
    setDraftRequired(!isItemExcusable(item));
    setModalMode({ editingId: item.id });
  };

  const confirmSave = () => {
    if (!draftName.trim() || !modalMode) return;
    if (modalMode.editingId) {
      updateExpectedItem(modalMode.editingId, { name: draftName.trim(), frequency: draftFrequency });
      setItemExcusable(modalMode.editingId, !draftRequired);
    } else {
      // Left unset unless required, so personal-care names still default to required.
      addExpectedItem({ name: draftName.trim(), frequency: draftFrequency, excusable: draftRequired ? false : undefined });
    }
    setModalMode(null);
  };

  const confirmDelete = (item: ExpectedItem) => {
    Alert.alert('Remove Expected activity', `Remove "${item.name}"? It comes off every day going forward.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteExpectedItem(item.id) },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ChildSettingsHeader title="Expected Activities" onBack={() => navigation.goBack()} />

      <ScrollView scrollEnabled={!dragging} contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        <Text style={styles.helper}>Drag the dots to set the order on the Today trail.</Text>

        <Pressable style={styles.addLink} onPress={openAdd}>
          <Text style={styles.addLinkText}>+ Add Expected activity</Text>
        </Pressable>
        {(['daily', 'weekly'] as const).map((frequency) => {
          const group = expectedItems.filter((item) => item.frequency === frequency);
          if (group.length === 0) return null;
          return (
            <React.Fragment key={frequency}>
              <Text style={styles.subSectionHeader}>{frequency === 'daily' ? 'Daily' : 'Weekly'}</Text>
              <DraggableList
                items={group}
                keyOf={(item) => item.id}
                labelOf={(item) => item.name}
                onReorder={(ids) => setExpectedOrder(frequency, ids)}
                onDragStateChange={setDragging}
                renderItem={(item, grip, { isDragging }) => (
                  <View style={[styles.row, isDragging && styles.rowLifted]}>
                    {grip}
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{item.name}</Text>
                      {item.linkedEventTitle && (
                        <Text style={styles.rowLinked}>🗓 From {item.linkedEventTitle}</Text>
                      )}
                    </View>
                    <View style={styles.rowActions}>
                      {item.frequency === 'daily' && !isItemExcusable(item) && (
                        <Text accessibilityLabel="Required even on days off" style={styles.lock}>🔒</Text>
                      )}
                      <Pressable hitSlop={LINK_HIT_SLOP} onPress={() => openEdit(item)}>
                        <Text style={styles.linkAction}>Edit</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              />
            </React.Fragment>
          );
        })}
      </ScrollView>

      <Modal visible={modalMode !== null} animationType="slide" transparent onRequestClose={() => setModalMode(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalMode(null)}>
            <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
              <Text style={styles.modalTitle}>{modalMode?.editingId ? 'Edit' : 'Add'} Expected activity</Text>
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
              {draftFrequency === 'daily' && (
                <View style={styles.requiredRow}>
                  <View style={styles.requiredText}>
                    <Text style={styles.requiredLabel}>Required even on days off</Text>
                    <Text style={styles.requiredHelp}>Stays on the list on a sick day, trip or birthday.</Text>
                  </View>
                  <Switch value={draftRequired} onValueChange={setDraftRequired} trackColor={{ true: colors.expected }} />
                </View>
              )}
              <View style={styles.modalActions}>
                <View>
                  {modalMode?.editingId && (
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => {
                        const id = modalMode.editingId;
                        const item = expectedItems.find((i) => i.id === id);
                        setModalMode(null);
                        if (item) confirmDelete(item);
                      }}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.modalActionsRight}>
                  <Pressable style={styles.modalCancelButton} onPress={() => setModalMode(null)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalSaveButton} onPress={confirmSave}>
                    <Text style={styles.modalSaveText}>{modalMode?.editingId ? 'Save' : 'Add'}</Text>
                  </Pressable>
                </View>
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
    paddingLeft: 4,
    backgroundColor: colors.surface,
  },
  rowLifted: {
    borderColor: colors.expected,
    elevation: 8,
    shadowColor: '#28204F',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  lock: { fontSize: 13 },
  requiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
    backgroundColor: colors.surface,
  },
  requiredText: { flex: 1, paddingRight: 12 },
  requiredLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  requiredHelp: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  removeButton: { paddingVertical: 12, paddingRight: 8 },
  removeButtonText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
  rowInfo: { flex: 1, flexShrink: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowLinked: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkAction: { color: colors.expected, fontSize: 13, fontWeight: '700' },
  linkActionDanger: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  addLink: { paddingVertical: 10, marginBottom: 6 },
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
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.expected, borderColor: colors.expected },
  chipText: { fontSize: 12, color: colors.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  modalActionsRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalCancelButton: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  modalSaveButton: { backgroundColor: colors.expected, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
