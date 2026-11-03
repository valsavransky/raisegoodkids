// A child's request about a goal: a new goal (the parent sets the price, which
// the child never sees), a new name for a goal, or switching which goal they
// work on. Nothing changes until a parent approves.
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { CurrencyInput } from '../../components/CurrencyInput';
import { NoteSheet } from '../../components/NoteSheet';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { useApprovals } from '../../context/ApprovalsContext';
import { useAppData } from '../../context/AppDataContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ApproveGoal'>;

export function ApproveGoalScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { submissions, decide } = useApprovals();
  const { childProfiles, householdGoals, goalProgressPercentage } = useAppData();
  const sub = submissions.find((s) => s.id === route.params.submissionId);
  const child = childProfiles.find((c) => c.id === sub?.childId);
  const goal = sub ? householdGoals.find((g) => g.id === sub.itemId) : undefined;
  const hasProgress = !!goal && goalProgressPercentage(goal.id) > 0;
  const [price, setPrice] = useState(goal ? String(goal.realWorldCost) : '');
  const [noteOpen, setNoteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!sub || sub.status !== 'pending') {
    return (
      <View style={styles.screen}>
        <SettingsSubHeader title="Goal request" onBack={() => navigation.goBack()} />
        <Text style={styles.missing}>{sub ? 'This has already been decided.' : 'This request is no longer here.'}</Text>
      </View>
    );
  }

  const childName = child?.name.trim().split(' ')[0] ?? 'Your child';
  const priceNumber = parseFloat(price);
  const needsPrice = sub.kind === 'goal_add' || (sub.kind === 'goal_rename' && !hasProgress);
  const priceOk = !needsPrice || (Number.isFinite(priceNumber) && priceNumber > 0);

  const finish = async (decision: 'approved' | 'declined', extra?: { note?: string; price?: number }) => {
    setBusy(true);
    const result = await decide(sub.id, decision, extra);
    setBusy(false);
    if (result === 'error') {
      Alert.alert('Couldn’t save', 'Check your connection and try again.');
      return;
    }
    navigation.goBack();
  };

  const title =
    sub.kind === 'goal_add'
      ? `${childName}’s new goal`
      : sub.kind === 'goal_rename'
        ? `${childName}’s goal change`
        : `${childName} wants to switch goals`;
  const switchTo = sub.kind === 'goal_switch' ? goal : undefined;
  const current = householdGoals.find((g) => g.childProfileId === sub.childId && g.status === 'active');

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Goal request" onBack={() => navigation.goBack()} />
      <KeyboardAwareScrollView avoid={false} contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>

        {sub.kind === 'goal_add' && (
          <>
            <Text style={styles.goalName}>{sub.payload.name}</Text>
            <Text style={styles.sub}>{childName} asked for this goal.</Text>
          </>
        )}
        {sub.kind === 'goal_rename' && (
          <>
            <Text style={styles.goalName}>
              “{goal?.name ?? 'Goal'}” → “{sub.payload.name}”
            </Text>
            {hasProgress && <Text style={styles.sub}>Progress so far stays with the goal.</Text>}
          </>
        )}
        {sub.kind === 'goal_switch' && (
          <>
            <Text style={styles.goalName}>{switchTo?.name ?? 'A goal'}</Text>
            <Text style={styles.sub}>
              {current ? `Instead of “${current.name}”. ` : ''}Gigs {childName} does from now on would count toward this goal. The other goal keeps its progress.
            </Text>
          </>
        )}

        {(sub.kind === 'goal_add' || sub.kind === 'goal_rename') && (
          <>
            <Text style={styles.label}>Price</Text>
            {sub.kind === 'goal_rename' && hasProgress ? (
              <Text style={styles.fixedPrice}>${goal?.realWorldCost}. It can’t change after progress has been made.</Text>
            ) : (
              <CurrencyInput placeholder="How much does it cost?" value={price} onChangeText={setPrice} />
            )}
            <Text style={styles.help}>
              {childName} never sees the price. It decides how much each gig moves the goal.
            </Text>
          </>
        )}

        <Pressable
          style={[styles.approve, (!priceOk || busy) && { opacity: 0.45 }]}
          disabled={!priceOk || busy}
          onPress={() =>
            finish('approved', sub.kind === 'goal_add' || (sub.kind === 'goal_rename' && !hasProgress) ? { price: priceNumber } : undefined)
          }
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.approveText}>Approve</Text>}
        </Pressable>
        <Pressable style={styles.notYet} disabled={busy} onPress={() => setNoteOpen(true)}>
          <Text style={styles.notYetText}>Not yet…</Text>
        </Pressable>
      </KeyboardAwareScrollView>

      <NoteSheet
        visible={noteOpen}
        title="Send this back"
        subtitle={`${childName} will see that it wasn’t approved, with your note.`}
        confirmLabel="Send back"
        onConfirm={(note) => {
          setNoteOpen(false);
          finish('declined', { note });
        }}
        onCancel={() => setNoteOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  missing: { textAlign: 'center', color: colors.textMuted, marginTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 14, fontWeight: '700', color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  goalName: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 10 },
  sub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 26, marginBottom: 8 },
  fixedPrice: { fontSize: 15, color: colors.text, lineHeight: 21 },
  help: { fontSize: 12.5, color: colors.textMuted, marginTop: 8, lineHeight: 18 },
  approve: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  approveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  notYet: { backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  notYetText: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
