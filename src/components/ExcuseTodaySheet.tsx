// The quick "Excuse today?" sheet opened from the ⋯ button on Today. Excusing
// a day makes the Expected activities marked "can be excused" optional for
// it and keeps the streak; trips and holidays ahead of time are set up under
// Settings → Excused days (the "Excuse more days…" link).
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../context/AppDataContext';
import { DailyExcuseReason } from '../types/models';
import { todayString } from '../utils/date';
import { colors } from '../theme/colors';

export const EXCUSE_REASON_LABELS: Record<DailyExcuseReason, string> = {
  sick: 'Sick day',
  travel: 'Travel',
  family_event: 'Family event',
  other: 'Other',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onMoreDays: () => void;
}

export function ExcuseTodaySheet({ visible, onClose, onMoreDays }: Props) {
  const insets = useSafeAreaInsets();
  const { childProfile, excuseInfo, excuseDays, removeExcuseDays } = useAppData();
  const [reason, setReason] = useState<DailyExcuseReason | undefined>(undefined);
  const today = todayString();
  const info = excuseInfo(today);
  const name = childProfile?.name?.trim().split(/\s+/)[0] ?? 'your child';

  const close = () => {
    setReason(undefined);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={[styles.card, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
          {info?.trigger === 'birthday' ? (
            <>
              <Text style={styles.title}>It's {name}'s birthday 🎂</Text>
              <Text style={styles.body}>Today is already a day off from the Expected activities that can be excused.</Text>
            </>
          ) : info ? (
            <>
              <Text style={styles.title}>Today is excused</Text>
              <Text style={styles.body}>
                Expected activities that can be excused are optional today{info.reason ? ` (${EXCUSE_REASON_LABELS[info.reason]})` : ''}, and the streak is kept.
              </Text>
              <Pressable
                style={styles.secondary}
                onPress={() => {
                  removeExcuseDays([today]);
                  close();
                }}
              >
                <Text style={styles.secondaryText}>Remove the excuse</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Excuse today?</Text>
              <Text style={styles.body}>
                Expected activities that can be excused become optional today, and the streak is kept. Gigs open up.
              </Text>
              <Text style={styles.label}>Reason (just for you)</Text>
              <View style={styles.chips}>
                {(Object.keys(EXCUSE_REASON_LABELS) as DailyExcuseReason[]).map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setReason(reason === r ? undefined : r)}
                    style={[styles.chip, reason === r && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, reason === r && styles.chipTextOn]}>{EXCUSE_REASON_LABELS[r]}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={styles.primary}
                onPress={() => {
                  excuseDays([today], reason);
                  close();
                }}
              >
                <Text style={styles.primaryText}>Excuse today</Text>
              </Pressable>
            </>
          )}
          <Pressable
            style={styles.secondary}
            onPress={() => {
              close();
              onMoreDays();
            }}
          >
            <Text style={styles.secondaryText}>Excuse more days…</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  card: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  body: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  chipOn: { backgroundColor: colors.expected, borderColor: colors.expected },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextOn: { color: '#fff' },
  primary: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondary: { backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
