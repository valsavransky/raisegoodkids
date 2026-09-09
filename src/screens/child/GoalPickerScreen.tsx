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
// Editing/deleting is only offered for goals AppDataContext.canModifyGoal
// allows — never the active goal, and never one carrying earned progress.
//
// The Future Fund section below the goal list is deliberately styled
// differently (violet, its own card shape) from the goal cards above it —
// it's a long-term investment/savings goal, not a wishlist item, per the
// vision doc's "pay yourself first" framing.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, SectionList, Modal, StyleSheet } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../../context/AppDataContext';
import { Goal } from '../../types/models';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components/AppHeader';
import { colors } from '../../theme/colors';

type GoalPickerNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Goal'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function GoalPickerScreen() {
  const navigation = useNavigation<GoalPickerNavigationProp>();
  const {
    goals,
    activeGoal,
    queuedGoals,
    completedGoals,
    addGoal,
    setActiveGoal,
    canModifyGoal,
    updateGoal,
    deleteGoal,
    goalProgressPercentage,
    futureFund,
    recordFutureFundContribution,
  } = useAppData();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCost, setDraftCost] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [milestoneExpanded, setMilestoneExpanded] = useState(true);
  const [contributionModalVisible, setContributionModalVisible] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');

  const active = activeGoal();
  const queued = queuedGoals();
  const completed = completedGoals();

  const sections = [
    ...(active ? [{ title: 'Active goal', data: [active] }] : []),
    ...(queued.length > 0 ? [{ title: 'Up next', data: queued }] : []),
    ...(completed.length > 0 ? [{ title: 'Completed', data: completed }] : []),
  ];

  const openAddModal = () => {
    setEditingGoalId(null);
    setDraftName('');
    setDraftCost('');
    setModalVisible(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setDraftName(goal.name);
    setDraftCost(String(goal.realWorldCost));
    setModalVisible(true);
  };

  const confirmSave = () => {
    const cost = parseFloat(draftCost);
    if (!draftName.trim() || Number.isNaN(cost) || cost <= 0) return;
    if (editingGoalId) {
      updateGoal(editingGoalId, { name: draftName.trim(), realWorldCost: cost });
    } else {
      addGoal(draftName.trim(), cost);
    }
    setModalVisible(false);
  };

  const confirmContribution = () => {
    const amount = parseFloat(contributionAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    recordFutureFundContribution(amount);
    setContributionModalVisible(false);
    setContributionAmount('');
  };

  const renderGoalRow = (item: Goal) => {
    const modifiable = canModifyGoal(item.id);

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
          <View style={styles.goalRowActions}>
            <Pressable onPress={() => setActiveGoal(item.id)}>
              <Text style={styles.linkAction}>Make active</Text>
            </Pressable>
            {modifiable && (
              <>
                <Pressable onPress={() => openEditModal(item)}>
                  <Text style={styles.linkAction}>Edit</Text>
                </Pressable>
                {deleteConfirmId === item.id ? (
                  <Pressable onPress={() => deleteGoal(item.id)}>
                    <Text style={styles.linkActionDanger}>Confirm delete</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setDeleteConfirmId(item.id)}>
                    <Text style={styles.linkActionDanger}>Delete</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
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

  const balance = futureFund?.balance ?? 0;
  const threshold = futureFund?.milestoneThreshold ?? 100;
  const milestoneReached = balance >= threshold;

  return (
    <View style={styles.screen}>
      <AppHeader />
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
        ListFooterComponent={
          <>
            <Pressable style={styles.addButton} onPress={openAddModal}>
              <Text style={styles.addButtonText}>+ Add a new goal</Text>
            </Pressable>

            {futureFund && (
              <View style={styles.futureFundCard}>
                <View style={styles.futureFundHeaderRow}>
                  <Text style={styles.futureFundIcon}>📈</Text>
                  <Text style={styles.futureFundTitle}>Future Fund</Text>
                </View>
                <Text style={styles.futureFundSubtitle}>
                  {futureFund.percentage}% of every gig goes here first — building toward a real investment account.
                </Text>
                <Text style={styles.futureFundAmount}>${balance.toFixed(2)} saved</Text>
                <View style={styles.futureFundProgressTrack}>
                  <View style={[styles.futureFundProgressFill, { width: `${Math.min((balance / threshold) * 100, 100)}%` }]} />
                </View>
                <Text style={styles.futureFundProgressCaption}>
                  ${balance.toFixed(0)} of ${threshold} milestone
                </Text>

                {milestoneReached && (
                  <View style={styles.milestoneSection}>
                    {milestoneExpanded ? (
                      <>
                        <Text style={styles.milestoneHeading}>Worth thinking about investing this</Text>
                        <View style={styles.milestoneCard}>
                          <Text style={styles.milestoneCardTitle}>Custodial Roth IRA</Text>
                          <Text style={styles.milestoneCardBody}>
                            Requires earned income — gig earnings may qualify.
                          </Text>
                        </View>
                        <View style={styles.milestoneCard}>
                          <Text style={styles.milestoneCardTitle}>Custodial brokerage account</Text>
                          <Text style={styles.milestoneCardBody}>More flexible, no earned-income requirement.</Text>
                        </View>
                        <Text style={styles.milestoneDisclaimer}>
                          This is general information, not financial advice. Consider talking with a financial professional.
                        </Text>
                        <View style={styles.milestoneActions}>
                          <Pressable onPress={() => setMilestoneExpanded(false)}>
                            <Text style={styles.linkAction}>Remind me later</Text>
                          </Pressable>
                          <Pressable onPress={() => setContributionModalVisible(true)}>
                            <Text style={[styles.linkAction, { color: colors.futureFund }]}>I moved money</Text>
                          </Pressable>
                        </View>
                      </>
                    ) : (
                      <Pressable onPress={() => setMilestoneExpanded(true)}>
                        <Text style={[styles.linkAction, { color: colors.futureFund }]}>
                          You've hit ${threshold} — tap to see investing options
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingGoalId ? 'Edit goal' : 'Add a goal'}</Text>
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
              <Pressable style={styles.modalAddButton} onPress={confirmSave}>
                <Text style={styles.modalAddText}>{editingGoalId ? 'Save' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={contributionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setContributionModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log a contribution</Text>
            <Text style={styles.futureFundSubtitle}>How much did you move to the real account?</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount ($)"
              keyboardType="decimal-pad"
              value={contributionAmount}
              onChangeText={setContributionAmount}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setContributionModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalAddButton, { backgroundColor: colors.futureFund }]} onPress={confirmContribution}>
                <Text style={styles.modalAddText}>Log it</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
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
  goalRowActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  linkAction: { color: colors.expected, fontSize: 13, fontWeight: '700' },
  linkActionDanger: { color: colors.danger, fontSize: 13, fontWeight: '700' },
  addButton: { paddingVertical: 12, alignItems: 'center' },
  addButtonText: { color: colors.expected, fontSize: 15, fontWeight: '600' },
  futureFundCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F4F1FF',
    borderWidth: 1,
    borderColor: colors.futureFund,
  },
  futureFundHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  futureFundIcon: { fontSize: 18 },
  futureFundTitle: { fontSize: 16, fontWeight: '800', color: colors.futureFund },
  futureFundSubtitle: { fontSize: 12, color: colors.textMuted, marginBottom: 10, lineHeight: 17 },
  futureFundAmount: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
  futureFundProgressTrack: { height: 8, borderRadius: 4, backgroundColor: '#E3DBFF', overflow: 'hidden' },
  futureFundProgressFill: { height: 8, borderRadius: 4, backgroundColor: colors.futureFund },
  futureFundProgressCaption: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontWeight: '600' },
  milestoneSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.futureFund },
  milestoneHeading: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10 },
  milestoneCard: { backgroundColor: colors.background, borderRadius: 10, padding: 12, marginBottom: 8 },
  milestoneCardTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  milestoneCardBody: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  milestoneDisclaimer: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 4, marginBottom: 10, lineHeight: 15 },
  milestoneActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
