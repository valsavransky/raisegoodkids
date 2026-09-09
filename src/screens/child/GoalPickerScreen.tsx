// Screen 3: goal picker — also the entry point when no goal is active yet.
// Goals are queued, not concurrent: one active goal at a time, a wishlist
// waits behind it in order (docs/screens-and-flows.md, screen 3).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Modal, StyleSheet } from 'react-native';
import { useAppData } from '../../context/AppDataContext';
import { colors } from '../../theme/colors';

export function GoalPickerScreen() {
  const { goals, activeGoal, queuedGoals, addGoal, goalProgressPercentage, futureFund } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftCost, setDraftCost] = useState('');

  const active = activeGoal();
  const queued = queuedGoals();

  const confirmAdd = () => {
    const cost = parseFloat(draftCost);
    if (!draftName.trim() || Number.isNaN(cost) || cost <= 0) return;
    addGoal(draftName.trim(), cost);
    setModalVisible(false);
    setDraftName('');
    setDraftCost('');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{goals.length === 0 ? 'Pick a goal to start earning' : 'Your goals'}</Text>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={active ? [active, ...queued] : queued}
        keyExtractor={(goal) => goal.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No goals yet — add your first one below.</Text>}
        renderItem={({ item, index }) => {
          const isActive = item.status === 'active';
          const progress = isActive ? goalProgressPercentage(item.id) : 0;
          return (
            <View style={[styles.goalRow, isActive && styles.goalRowActive]}>
              <View style={styles.goalRowTop}>
                <Text style={styles.goalName}>{item.name}</Text>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>{'✓'} Active goal</Text>
                  </View>
                ) : (
                  <Text style={styles.queuedLabel}>{index === (active ? 1 : 0) ? 'Up next' : 'Waiting in line'}</Text>
                )}
              </View>
              {isActive && (
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
              )}
            </View>
          );
        }}
      />

      <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add a new goal</Text>
      </Pressable>

      {futureFund && (
        <View style={styles.futureFundRow}>
          <Text style={[styles.futureFundIcon, { color: colors.futureFund }]}>{'↑'}</Text>
          <Text style={styles.futureFundText}>{futureFund.percentage}% of every gig goes here first</Text>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add a goal</Text>
            <TextInput style={styles.input} placeholder="What are you saving for?" value={draftName} onChangeText={setDraftName} />
            <TextInput
              style={styles.input}
              placeholder="Cost ($)"
              keyboardType="decimal-pad"
              value={draftCost}
              onChangeText={setDraftCost}
            />
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
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  goalRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  goalRowActive: { borderColor: colors.gigs, borderWidth: 2 },
  goalRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  activeBadge: { backgroundColor: colors.gigs, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  queuedLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  progressBarTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 12, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: colors.gigs },
  addButton: { marginHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  addButtonText: { color: colors.expected, fontSize: 15, fontWeight: '600' },
  futureFundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  futureFundIcon: { fontSize: 16, fontWeight: '700' },
  futureFundText: { fontSize: 13, color: colors.textMuted, flexShrink: 1 },
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
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancelButton: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  modalAddButton: { backgroundColor: colors.expected, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  modalAddText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
