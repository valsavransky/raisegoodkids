// A one-time card at the top of Today for parents who haven't seen Family devices.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { isFamilyCardDismissed, dismissFamilyCard } from '../utils/familyIntro';
import { track } from '../services/analytics';

export function FamilyDeviceCard({ onSetUp }: { onSetUp: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    isFamilyCardDismissed().then((dismissed) => setVisible(!dismissed));
  }, []);
  if (!visible) return null;

  const close = (action: 'set_up' | 'not_now') => {
    track('family_card_closed', { action });
    dismissFamilyCard();
    setVisible(false);
  };

  return (
    <View style={styles.card}>
      <Pressable style={styles.x} onPress={() => close('not_now')} hitSlop={12} accessibilityLabel="Dismiss">
        <Text style={styles.xText}>✕</Text>
      </Pressable>
      <Text style={styles.title}>New: kids can tap for themselves</Text>
      <Text style={styles.body}>
        Set up a family tablet or an old phone. Your kids tap things done, and you approve from here.
      </Text>
      <View style={styles.buttons}>
        <Pressable
          style={styles.primary}
          onPress={() => {
            close('set_up');
            onSetUp();
          }}
        >
          <Text style={styles.primaryText}>Set it up</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => close('not_now')}>
          <Text style={styles.secondaryText}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#E4F4F1', borderColor: '#BFE4DE', borderWidth: 1, borderRadius: 14, padding: 14 },
  x: { position: 'absolute', right: 12, top: 10, zIndex: 1 },
  xText: { color: '#0B6D63', fontSize: 14, fontWeight: '700' },
  title: { fontSize: 14.5, fontWeight: '800', color: '#0B6D63', paddingRight: 22 },
  body: { fontSize: 13, color: '#0B6D63', lineHeight: 19, marginTop: 4 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  primary: { backgroundColor: '#0F9B8E', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  secondary: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  secondaryText: { color: '#0B6D63', fontSize: 13, fontWeight: '800' },
});
