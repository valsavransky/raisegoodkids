// Screen 3: goal picker — also the entry point when no goal is active yet.
// Goals are queued, not concurrent: one active goal at a time, a wishlist
// waits behind it in order (docs/screens-and-flows.md, screen 3).
//
// Shows every goal, not just active/queued — achieved and fulfilled goals
// used to disappear from this list entirely once they left 'active', which
// made it look like nothing had happened. A queued goal can also be
// switched to active directly: since progress is derived per-goal from its
// own GigCompletions (see AppDataContext.goalProgressPercentage), swapping
// which goal is active never loses anything already earned toward any goal.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, SectionList, Modal, StyleSheet } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../../context/AppDataContext';
import { Goal } from '../../types/models';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type GoalPickerNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Goal'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function GoalPickerScreen() {
  const navigation = useNavigation<GoalPickerNavigationProp>();
  const { goals, activeGoal, queuedGoals, addGoal, setActiveGoal, goalProgressPercentage, futureFund } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftCost, setDraftCost] = useState('');

  const active = activeGoal();
  const queued = queuedGoals();
  const completed = goals
    .filter((g) => g.status === 'achieved' || g.status === 'fulfilled')
    .sort((a, b) => (b.achievedAt ?? '').localeCompare(a.achievedAt ?? ''));

  const sections = [
    ...(active ? [{ title: 'Active goal', data: [active] }] : []),
    ...(queued.length > 0 ? [{ title: 'Up next', data: queued }] : []),
    ...(completed.length > 0 ? [{ title: 'Completed', data: completed }] : []),
  ];

  const confirmAdd = () => {
    const cost = parseFloat(draftCost);
    if (!draftName.trim() || Number.isNaN(cost) || cost <= 0) return;
    addGoal(draftName.trim(), cost);
    setModalVisible(false);
    setDraftName('');
    setDraftCost('');
  };

  const renderGoalRow = (item: Goal) => {
    if (item.status === 'active') {
      const progress = goalProgressPercentage(item.id);
      return (
        <View style={[styles.goalRow, styles.goalRowActive]}>
          <View style={styles.goalRowTop}>
            <Text style={styles.goalName}>{item.name}</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{'✓'} Active goal</Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
        </View>
      );
    }

    if (item.status === 'queued') {
      return (
        <View style={styles.goalRow}>
          <View style={styles.goalRowTop}>
            <Text style={styles.goalName}>{item.name}</Text>
          </View>
          <Pressable style={styles.makeActiveButton} onPress={() => setActiveGoal(item.id)}>
            <Text style={styles.makeActiveButtonText}>Make active</Text>
          </Pressable>
        </View>
      );
    }

    if (item.status === 'achieved') {
      return (
        <View style={[styles.goalRow, styles.goalRowAchieved]}>
          <View style={styles.goalRowTop}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={styles.achievedLabel}>🏆 Achieved</Text>
          </View>
          <Pressable style={styles.makeActiveButton} onPress={() => navigation.navigate('FulfillGoal', { goalId: item.id })}>
            <Text style={styles.makeActiveButtonText}>Finish up</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.goalRow}>
        <View style={styles.goalRowTop}>
          <Text style={styles.goalName}>{item.name}</Text>
          <Text style={styles.fulfilledLabel}>✓ Fulfilled</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{goals.length === 0 ? 'Pick a goal to start earning' : 'Your goals'}</Text>
      </View>

      <SectionList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        sections={sections}
        keyExtractor={(goal) => goal.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No goals yet — add your first one below.</Text>}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => renderGoalRow(item)}
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
  sectionHeader: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginTop: 12, marginBottom: 8 },
  goalRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  goalRowActive: { borderColor: colors.gigs, borderWidth: 2 },
  goalRowAchieved: { borderColor: colors.gigs, borderStyle: 'dashed' },
  goalRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  activeBadge: { backgroundColor: colors.gigs, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  achievedLabel: { fontSize: 12, color: colors.gigs, fontWeight: '700' },
  fulfilledLabel: { fontSize: 12, color: colors.success, fontWeight: '700' },
  progressBarTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, marginTop: 12, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4, backgroundColor: colors.gigs },
  makeActiveButton: { marginTop: 10, alignSelf: 'flex-start' },
  makeActiveButtonText: { color: colors.expected, fontSize: 13, fontWeight: '700' },
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
