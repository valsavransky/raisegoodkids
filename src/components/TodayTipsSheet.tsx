// "Tips about this page": a short list explaining how the Today screen works,
// opened from the ⋯ menu. (The one-line hint on Today itself disappears after
// the first check-off; this brings the explanation back.)
import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export const TAP_HINT = 'Tap an activity to mark it complete. Tap again to undo.';

const TIPS: { icon: string; title: string; body: string }[] = [
  { icon: '👆', title: 'Check things off', body: TAP_HINT },
  { icon: '🔥', title: 'Streaks', body: 'The streak counts days in a row with every daily Expected activity done.' },
  { icon: '🌴', title: 'Days off', body: 'Sick day or a trip? Tap ⋯ then Excuse today. The streak is kept, and birthdays are excused automatically.' },
  { icon: '🗓️', title: 'Missed something?', body: 'On This Week, tap a day from the past week to fill in anything that was forgotten.' },
  { icon: '⚙️', title: 'Make it yours', body: 'Tap the name at the top right to open Settings (choose Settings in the list if you have more than one child). There you can change activities and gigs, their order, gig values, the daily reminder and more.' },
];

export function TodayTipsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // An explicit height cap for the list (the sheet's title, button and padding
  // take about 150), so a long list always scrolls inside the sheet instead of
  // running off the bottom.
  const listMaxHeight = Math.max(160, height * 0.85 - 150 - insets.bottom);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]} onPress={() => {}}>
          <Text style={styles.title}>Tips about this page</Text>
          <ScrollView style={[styles.list, { maxHeight: listMaxHeight }]} showsVerticalScrollIndicator nestedScrollEnabled>
            {TIPS.map((tip) => (
              <View key={tip.title} style={styles.tip}>
                <Text style={styles.icon}>{tip.icon}</Text>
                <View style={styles.tipText}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipBody}>{tip.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10 },
  list: { flexGrow: 0, flexShrink: 1 },
  tip: { flexDirection: 'row', gap: 14, paddingVertical: 9 },
  icon: { fontSize: 22, width: 30, textAlign: 'center' },
  tipText: { flex: 1 },
  tipTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  tipBody: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: 1 },
  button: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
