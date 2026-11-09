// Shared pieces of the Expected and Gigs setup pages: a banner that says the
// suggestions are picked for the child's grade, and a collapsed "More ideas"
// section so a parent starts from a short list instead of 20 pre-checked rows.
import React, { ReactNode, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const TEAL_SOFT = '#E4F4F1';
const TEAL_DARK = '#0B6D63';

export function GradeBanner({ childName, gradeText, onChange }: { childName: string; gradeText: string; onChange?: () => void }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerEmoji}>🎒</Text>
      <Text style={styles.bannerText} numberOfLines={2}>
        Picked for {childName}, {gradeText}
      </Text>
      {onChange ? (
        <Pressable onPress={onChange} hitSlop={10}>
          <Text style={styles.bannerLink}>Change</Text>
        </Pressable>
      ) : null}
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

type Tier = 'quick' | 'medium' | 'big_job';
const TIER_LABELS: Record<Tier, string> = { quick: 'Quick', medium: 'Medium', big_job: 'Big job' };

/** Small colored pill for a gig's size. With onPress it shows a ▾ and opens a picker. */
export function SizeTag({ tier, label, onPress }: { tier: Tier; label?: string; onPress?: () => void }) {
  const text = `${label ?? TIER_LABELS[tier]}${onPress ? ' ▾' : ''}`;
  const pill = (
    <View style={[styles.sizeTag, tier === 'quick' && styles.sizeTagQuick, tier === 'big_job' && styles.sizeTagBig]}>
      <Text style={styles.sizeTagText}>{text}</Text>
    </View>
  );
  if (!onPress) return pill;
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Size: ${TIER_LABELS[tier]}. Tap to change.`}>
      {pill}
    </Pressable>
  );
}

/** Three pills to choose a gig's size. */
export function SizePicker({ value, onSelect }: { value: Tier; onSelect: (tier: Tier) => void }) {
  return (
    <View style={styles.pickerRow}>
      {(['quick', 'medium', 'big_job'] as Tier[]).map((tier) => (
        <Pressable
          key={tier}
          onPress={() => onSelect(tier)}
          style={[styles.pickerPill, value === tier && styles.pickerPillOn]}
        >
          <Text style={[styles.pickerText, value === tier && styles.pickerTextOn]}>{TIER_LABELS[tier]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Matching pill for an Expected activity's frequency. */
export function FrequencyTag({ frequency }: { frequency: 'daily' | 'weekly' }) {
  return (
    <View style={[styles.sizeTag, styles.freqTag]}>
      <Text style={styles.sizeTagText}>{frequency === 'daily' ? 'Daily' : 'Weekly'}</Text>
    </View>
  );
}

/** A not-yet-added suggestion in Settings: tap anywhere on the row to add it to the list. */
export function IdeaRow({ name, meta, tier, frequency, onAdd }: { name: string; meta?: string; tier?: Tier; frequency?: 'daily' | 'weekly'; onAdd: () => void }) {
  return (
    <Pressable style={styles.ideaRow} onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Add ${name}`}>
      <View style={styles.ideaPlus}>
        <Text style={styles.ideaPlusText}>+</Text>
      </View>
      <Text style={styles.ideaName}>{name}</Text>
      {tier ? <SizeTag tier={tier} /> : frequency ? <FrequencyTag frequency={frequency} /> : meta ? <Text style={styles.ideaMeta}>{meta}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  freqTag: { backgroundColor: '#EEF1F6' },
  pickerRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  pickerPill: { borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 11, paddingVertical: 5 },
  pickerPillOn: { backgroundColor: colors.gigs, borderColor: colors.gigs },
  pickerText: { fontSize: 12, color: colors.text },
  pickerTextOn: { color: '#fff', fontWeight: '700' },
  sizeTag: { alignSelf: 'flex-start', backgroundColor: '#FCEBD2', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  sizeTagQuick: { backgroundColor: '#E4F4F1' },
  sizeTagBig: { backgroundColor: '#F1E9FF' },
  sizeTagText: { fontSize: 11.5, fontWeight: '700', color: colors.text },
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
