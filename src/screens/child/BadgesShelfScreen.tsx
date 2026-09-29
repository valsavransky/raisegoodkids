// Screen 11: badge shelf ("Badges" tab). Earned badges show in full color
// with the date they were earned; locked ones are grayed out with a lock, and
// the ones with a countable goal (streaks, gig counts, Future Fund) carry a
// progress ring. Tapping any badge opens a small sheet that says how to earn
// it and how far along the child is — a locked badge should always answer
// "what do I do next?". The three "$ Saved" badges are hidden while the
// Future Fund is off (and has no balance), so the shelf never asks for a fund
// the family hasn't turned on.
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../../context/AppDataContext';
import { BADGE_CATALOG, BadgeCatalogEntry, STREAK_THRESHOLDS, GIG_MILESTONE_THRESHOLDS, FUTURE_FUND_THRESHOLDS } from '../../data/badgeCatalog';
import { AppHeader } from '../../components/AppHeader';
import { BadgeIconGlyph } from '../../components/BadgeIconGlyph';
import { isExpectedItemSatisfied } from '../../utils/expectedItemStatus';
import { todayString } from '../../utils/date';
import { colors } from '../../theme/colors';

const RING_SIZE = 64;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface Progress {
  /** 0..1, when the badge has a countable target (draws the ring). */
  fraction?: number;
  /** Short tile caption, e.g. "1 of 5". */
  short: string;
  /** Longer line for the detail sheet, e.g. "1 of 5 gigs". */
  long: string;
}

function formatEarnedDate(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function BadgesShelfScreen() {
  const insets = useSafeAreaInsets();
  const {
    badges,
    futureFund,
    gigCompletions,
    expectedItems,
    expectedCompletions,
    expectedStreak,
    activeGoal,
    goalProgressPercentage,
  } = useAppData();
  const [selected, setSelected] = useState<BadgeCatalogEntry | null>(null);

  const fundVisible = !!futureFund && (futureFund.percentage > 0 || futureFund.balance > 0);
  const catalog = BADGE_CATALOG.filter((b) => b.type !== 'future_fund_milestone' || fundVisible);
  const earnedCount = catalog.filter((b) => badges.some((e) => e.catalogId === b.catalogId)).length;

  const streak = expectedStreak();
  const approvedGigs = gigCompletions.filter((c) => c.status === 'approved');
  const goal = activeGoal();
  const today = todayString();
  const weeklyItems = expectedItems.filter((i) => i.active && i.frequency === 'weekly');
  const weeklyDone = weeklyItems.filter((i) => isExpectedItemSatisfied(i, expectedCompletions, today)).length;

  const progressFor = (entry: BadgeCatalogEntry): Progress => {
    const streakRule = STREAK_THRESHOLDS.find((t) => t.catalogId === entry.catalogId);
    if (streakRule) {
      const day = Math.min(streak, streakRule.days);
      return { fraction: day / streakRule.days, short: `Day ${day} of ${streakRule.days}`, long: `Day ${day} of ${streakRule.days}` };
    }
    const gigRule = GIG_MILESTONE_THRESHOLDS.find((t) => t.catalogId === entry.catalogId);
    if (gigRule) {
      const n = Math.min(approvedGigs.length, gigRule.count);
      return { fraction: n / gigRule.count, short: `${n} of ${gigRule.count}`, long: `${n} of ${gigRule.count} gigs` };
    }
    const fundRule = FUTURE_FUND_THRESHOLDS.find((t) => t.catalogId === entry.catalogId);
    if (fundRule) {
      const saved = Math.min(futureFund?.balance ?? 0, fundRule.amount);
      return {
        fraction: saved / fundRule.amount,
        short: `$${saved.toFixed(0)} of $${fundRule.amount}`,
        long: `$${saved.toFixed(0)} of $${fundRule.amount} saved`,
      };
    }
    if (entry.catalogId === 'weekly_expected_done') {
      return weeklyItems.length > 0
        ? { short: `${weeklyDone} of ${weeklyItems.length}`, long: `${weeklyDone} of ${weeklyItems.length} weekly activities done` }
        : { short: 'Tap to see how', long: 'No weekly activities yet' };
    }
    if (entry.catalogId === 'goal_achieved') {
      return goal
        ? { short: `${Math.min(goalProgressPercentage(goal.id), 100)}% there`, long: `${goal.name} is ${Math.min(goalProgressPercentage(goal.id), 100)}% there` }
        : { short: 'Tap to see how', long: 'Pick a goal to get started' };
    }
    return { short: 'Tap to see how', long: 'Not yet' };
  };

  const earnedRecord = (entry: BadgeCatalogEntry) => badges.find((b) => b.catalogId === entry.catalogId);
  const selectedEarned = selected ? earnedRecord(selected) : undefined;
  const selectedProgress = selected ? progressFor(selected) : undefined;

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your badges</Text>
        <Text style={styles.subtitle}>
          {earnedCount} of {catalog.length} earned
        </Text>

        <View style={styles.grid}>
          {catalog.map((entry) => {
            const earned = earnedRecord(entry);
            const progress = progressFor(entry);
            return (
              <Pressable key={entry.catalogId} style={styles.tile} onPress={() => setSelected(entry)}>
                <View style={styles.ringWrap}>
                  {!earned && progress.fraction !== undefined && progress.fraction > 0 && (
                    <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
                      <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke={colors.border} strokeWidth={RING_STROKE} fill="none" />
                      <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_RADIUS}
                        stroke={entry.color}
                        strokeWidth={RING_STROKE}
                        fill="none"
                        strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                        strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress.fraction)}
                        strokeLinecap="round"
                        rotation={-90}
                        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                      />
                    </Svg>
                  )}
                  <View style={[styles.iconCircle, earned ? { borderColor: entry.color, backgroundColor: colors.surface } : styles.iconCircleLocked]}>
                    <BadgeIconGlyph
                      icon={earned ? entry.icon : '🔒'}
                      size={28}
                      color={entry.color}
                      textStyle={[styles.icon, !earned && styles.iconLocked]}
                    />
                  </View>
                </View>
                <Text style={[styles.tileTitle, !earned && styles.tileTitleLocked]}>{entry.title}</Text>
                <Text style={[styles.tileCaption, earned && { color: entry.color, fontWeight: '700' }]}>
                  {earned ? formatEarnedDate(earned.earnedAt) : progress.short}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]} onPress={() => {}}>
            {selected && (
              <>
                <View style={[styles.sheetIcon, selectedEarned ? { borderColor: selected.color } : styles.iconCircleLocked]}>
                  <BadgeIconGlyph
                    icon={selectedEarned ? selected.icon : '🔒'}
                    size={34}
                    color={selected.color}
                    textStyle={[styles.sheetIconText, !selectedEarned && styles.iconLocked]}
                  />
                </View>
                <Text style={styles.sheetTitle}>{selected.title}</Text>
                <Text style={styles.sheetBody}>{selected.requirement}</Text>
                {selectedEarned ? (
                  <Text style={[styles.sheetProgress, { color: selected.color }]}>Earned {formatEarnedDate(selectedEarned.earnedAt)} 🎉</Text>
                ) : (
                  selectedProgress && <Text style={styles.sheetProgress}>{selectedProgress.long}</Text>
                )}
                <Pressable style={styles.sheetButton} onPress={() => setSelected(null)}>
                  <Text style={styles.sheetButtonText}>Got it</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: { width: '46%', alignItems: 'center', paddingVertical: 12 },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ring: { position: 'absolute' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleLocked: { borderColor: colors.border, backgroundColor: colors.surface },
  icon: { fontSize: 26 },
  iconLocked: { opacity: 0.5 },
  tileTitle: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center' },
  tileTitleLocked: { color: colors.textMuted },
  tileCaption: { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  sheetIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sheetIconText: { fontSize: 32 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sheetBody: { fontSize: 14, color: colors.text, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  sheetProgress: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: 10 },
  sheetButton: {
    marginTop: 18,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  sheetButtonText: { fontSize: 15, fontWeight: '700', color: colors.text },
});
