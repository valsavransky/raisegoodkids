// Shared pieces of the Expected and Gigs setup pages: a banner that says the
// suggestions are picked for the child's grade, and a collapsed "More ideas"
// section so a parent starts from a short list instead of 20 pre-checked rows.
import React, { ReactNode, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const TEAL_SOFT = '#E4F4F1';
const TEAL_DARK = '#0B6D63';

export function GradeBanner({ childName, gradeText, onChange }: { childName: string; gradeText: string; onChange: () => void }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerEmoji}>🎒</Text>
      <Text style={styles.bannerText} numberOfLines={2}>
        Picked for {childName}, {gradeText}
      </Text>
      <Pressable onPress={onChange} hitSlop={10}>
        <Text style={styles.bannerLink}>Change</Text>
      </Pressable>
    </View>
  );
}

export function SectionLabel({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{title}</Text>
      {note ? <Text style={styles.labelNote}>{note}</Text> : null}
    </View>
  );
}

export function MoreIdeas({ gradeText, count, children }: { gradeText: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <View style={styles.more}>
      <Pressable style={styles.moreHeader} onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.moreTitle}>More ideas for {gradeText}</Text>
          <Text style={styles.moreSub}>Tap to add any you like</Text>
        </View>
        <Text style={styles.moreCount}>
          {count} {open ? '▴' : '▾'}
        </Text>
      </Pressable>
      {open ? <View>{children}</View> : null}
    </View>
  );
}

/** A not-yet-added suggestion in Settings: tap anywhere on the row to add it to the list. */
export function IdeaRow({ name, meta, onAdd }: { name: string; meta?: string; onAdd: () => void }) {
  return (
    <Pressable style={styles.ideaRow} onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Add ${name}`}>
      <View style={styles.ideaPlus}>
        <Text style={styles.ideaPlusText}>+</Text>
      </View>
      <Text style={styles.ideaName}>{name}</Text>
      {meta ? <Text style={styles.ideaMeta}>{meta}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ideaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  ideaPlus: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: TEAL_DARK, alignItems: 'center', justifyContent: 'center' },
  ideaPlusText: { color: TEAL_DARK, fontSize: 15, fontWeight: '700', lineHeight: 17 },
  ideaName: { flex: 1, fontSize: 15, color: colors.text },
  ideaMeta: { fontSize: 12, color: colors.textMuted },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TEAL_SOFT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  bannerEmoji: { fontSize: 16 },
  bannerText: { flex: 1, fontSize: 13.5, fontWeight: '700', color: TEAL_DARK },
  bannerLink: { fontSize: 13, fontWeight: '700', color: TEAL_DARK, textDecorationLine: 'underline' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 2 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  labelNote: { fontSize: 12, fontWeight: '700', color: TEAL_DARK },
  more: { marginTop: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#BFE3DD', borderRadius: 12, paddingHorizontal: 12 },
  moreHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  moreTitle: { fontSize: 14, fontWeight: '700', color: TEAL_DARK },
  moreSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  moreCount: { fontSize: 13, fontWeight: '700', color: TEAL_DARK },
});
