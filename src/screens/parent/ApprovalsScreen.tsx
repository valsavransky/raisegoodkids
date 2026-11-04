// "Waiting for you": what children sent in from family devices, grouped by child
// and then by Goals / Expected / Gigs. Expected activities and gigs start ticked
// (meaning "will be approved"); untick one to send it back, with an optional
// note. Goal requests open their own screen, because a new goal needs a price.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { formatShortDate } from '../../utils/date';
import { useSheet } from '../../components/SheetProvider';
import { getAvatarColors } from '../../data/avatars';
import { AvatarGlyph } from '../../components/AvatarGlyph';
import { NoteSheet } from '../../components/NoteSheet';
import { useApprovals } from '../../context/ApprovalsContext';
import { useAppData } from '../../context/AppDataContext';
import { useSubmissionLabels } from '../../hooks/useSubmissionLabels';
import { Submission } from '../../types/models';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Approvals'>;

export function ApprovalsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { pending, goalsToFinish, decide, refresh } = useApprovals();
  const { childProfiles } = useAppData();
  const sheet = useSheet();
  const labelOf = useSubmissionLabels();
  // Items the parent unticked (to be sent back), and the notes written for them.
  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteFor, setNoteFor] = useState<Submission | null>(null);
  const [busyChild, setBusyChild] = useState<string | null>(null);

  const toggle = (id: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submitChild = async (childId: string, items: Submission[]) => {
    setBusyChild(childId);
    const results: { item: Submission; ok: boolean }[] = [];
    for (const item of items) {
      const sendBack = unticked.has(item.id);
      const result = await decide(item.id, sendBack ? 'declined' : 'approved', sendBack ? { note: notes[item.id] } : undefined);
      results.push({ item, ok: result !== 'error' });
    }
    setBusyChild(null);
    await refresh();
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      const ok = results.length - failed.length;
      sheet.show({
        emoji: '⚠️',
        emojiBg: '#FCEBD2',
        title: `${ok} went through, ${failed.length} didn’t`,
        body: 'Blame the wifi. Tap to retry the rest.',
        rows: results.map((r) => ({
          status: r.ok ? 'ok' : 'bad',
          title: labelOf(r.item).title,
          tag: r.ok ? 'Done' : 'Not saved',
          tagTone: r.ok ? 'good' : 'bad',
        })),
        actions: [
          { label: 'Retry', onPress: () => submitChild(childId, failed.map((f) => f.item)) },
          { label: 'Not now', kind: 'link' },
        ],
      });
    }
  };

  const groups = childProfiles
    .map((child) => ({
      child,
      items: pending.filter((s) => s.childId === child.id),
      finish: goalsToFinish.filter((g) => g.childProfileId === child.id),
    }))
    .filter((g) => g.items.length > 0 || g.finish.length > 0);

  const renderSection = (title: string, items: Submission[], kind: 'goal' | 'expected' | 'gig') => {
    if (items.length === 0) return null;
    return (
      <>
        <Text style={styles.sectionLabel}>{title}</Text>
        {items.map((s) => {
          const label = labelOf(s);
          if (kind === 'goal') {
            return (
              <Pressable key={s.id} style={styles.row} onPress={() => navigation.navigate('ApproveGoal', { submissionId: s.id })}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{label.title}</Text>
                  {label.detail ? <Text style={styles.rowDetail}>{label.detail}</Text> : null}
                </View>
                <Text style={styles.chevron}>{'›'}</Text>
              </Pressable>
            );
          }
          const on = !unticked.has(s.id);
          const accent = kind === 'gig' ? colors.gigs : colors.expected;
          return (
            <View key={s.id}>
              <Pressable style={styles.row} onPress={() => toggle(s.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                <View style={[styles.box, on ? { backgroundColor: accent, borderColor: accent } : styles.boxOff]}>
                  {on && <Text style={styles.boxMark}>✓</Text>}
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{label.title}</Text>
                  {label.detail ? <Text style={[styles.rowDetail, kind === 'gig' && { color: '#B96A08' }]}>{label.detail}</Text> : null}
                </View>
              </Pressable>
              {!on && (
                <Pressable style={styles.sendBackRow} onPress={() => setNoteFor(s)} hitSlop={6}>
                  <Text style={styles.sendBackText}>
                    Sending back · <Text style={styles.noteLink}>{notes[s.id] ? 'Edit note' : 'Add a note'}</Text>
                  </Text>
                  {notes[s.id] ? <Text style={styles.noteText} numberOfLines={1}>“{notes[s.id]}”</Text> : null}
                </Pressable>
              )}
            </View>
          );
        })}
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Waiting for you" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>Nothing waiting</Text>
            <Text style={styles.emptyText}>When a child sends something in from a family device, or reaches a goal, it shows up here.</Text>
          </View>
        ) : (
          groups.map(({ child, items, finish }) => {
            const doable = items.filter((s) => !labelOf(s).isGoal);
            const approveCount = doable.filter((s) => !unticked.has(s.id)).length;
            const backCount = doable.length - approveCount;
            const firstName = child.name.trim().split(/\s+/)[0] || 'them';
            const buttonLabel =
              backCount === 0
                ? `Approve ${approveCount} for ${firstName}`
                : approveCount === 0
                  ? `Send back ${backCount} to ${firstName}`
                  : `Approve ${approveCount} · send back ${backCount}`;
            const tone = getAvatarColors(child.avatarId);
            const busy = busyChild === child.id;
            return (
              <View key={child.id} style={[styles.card, { borderColor: tone.main, borderWidth: 1.5, overflow: 'hidden', padding: 0 }]}>
                <View style={[styles.cardHeader, { backgroundColor: tone.tint, paddingHorizontal: 14, paddingVertical: 10 }]}>
                  <View style={[styles.avatarRing, { borderColor: tone.main }]}>
                    <AvatarGlyph avatarId={child.avatarId} size={30} />
                  </View>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.waiting}>{items.length + finish.length} waiting</Text>
                </View>
                <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                {finish.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Goals to finish</Text>
                    {finish.map((g) => (
                      <Pressable key={g.id} style={styles.row} onPress={() => navigation.navigate('FulfillGoal', { goalId: g.id })}>
                        <Text style={{ fontSize: 22 }}>🏆</Text>
                        <View style={styles.rowText}>
                          <Text style={styles.rowTitle}>{g.name}</Text>
                          <Text style={styles.rowDetail}>
                            Reached{g.achievedAt ? ` ${formatShortDate(g.achievedAt.slice(0, 10))}` : ''}. Mark it fulfilled once you’ve handled it.
                          </Text>
                        </View>
                        <Text style={styles.chevron}>{'›'}</Text>
                      </Pressable>
                    ))}
                  </>
                )}
                {renderSection('Goals', items.filter((s) => labelOf(s).isGoal), 'goal')}
                {renderSection('Expected', items.filter((s) => s.kind === 'expected'), 'expected')}
                {renderSection('Gigs', items.filter((s) => s.kind === 'gig'), 'gig')}
                {doable.length > 0 && (
                  <Pressable style={[styles.button, { backgroundColor: tone.main }, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => submitChild(child.id, doable)}>
                    {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{buttonLabel}</Text>}
                  </Pressable>
                )}
                </View>
              </View>
            );
          })
        )}
        {groups.length > 0 && <Text style={styles.hint}>Ticked items will be approved. Untick one to send it back.</Text>}
      </ScrollView>

      <NoteSheet
        visible={noteFor !== null}
        title={noteFor ? `Not quite? Tell ${childProfiles.find((c) => c.id === noteFor.childId)?.name.trim().split(/\s+/)[0] ?? 'them'}` : ''}
        subject={noteFor ? { title: labelOf(noteFor).title, small: `Tapped ${new Date(noteFor.submittedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` } : undefined}
        quickReplies={['Not done yet', 'Please show me', 'Try again after school']}
        childName={noteFor ? childProfiles.find((c) => c.id === noteFor.childId)?.name.trim().split(/\s+/)[0] : undefined}
        initialNote={noteFor ? notes[noteFor.id] ?? '' : ''}
        confirmLabel="Save note"
        onConfirm={(note) => {
          if (noteFor) setNotes((prev) => ({ ...prev, [noteFor.id]: note }));
          setNoteFor(null);
        }}
        onCancel={() => setNoteFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 34, color: colors.expected, fontWeight: '800' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginBottom: 14, backgroundColor: colors.background },
  avatarRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  childName: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  waiting: { fontSize: 13, fontWeight: '800', color: '#B96A08' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: colors.textMuted, textTransform: 'uppercase', marginTop: 14, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowDetail: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 20, color: colors.textMuted },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  boxOff: { backgroundColor: '#fff', borderColor: '#C9CCD3' },
  boxMark: { color: '#fff', fontSize: 15, fontWeight: '800' },
  sendBackRow: { paddingLeft: 36, paddingBottom: 8 },
  sendBackText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  noteLink: { color: colors.expected, fontWeight: '800' },
  noteText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  button: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
});
