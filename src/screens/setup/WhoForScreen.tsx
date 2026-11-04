// The very first screen on a fresh install: is this a parent setting up Trekker, or a kid's device
// joining a family with a code? Parents carry on to the welcome slides.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { Logo } from '../../components/Logo';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'WhoFor'>;

export function WhoForScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: 24 + insets.bottom }]}>
      <View style={styles.brandRow}>
        <Logo size={56} />
        <Text style={styles.wordmark}>Trekker</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.title}>Who’s this phone for?</Text>
        <Pressable style={[styles.card, { borderColor: colors.expected }]} onPress={() => navigation.navigate('Welcome')}>
          <Text style={styles.emoji}>🧑‍🍼</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>I’m a parent</Text>
            <Text style={styles.cardSub}>Set up Trekker for my family</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={[styles.card, { borderColor: colors.gigs }]} onPress={() => navigation.navigate('PairDevice')}>
          <Text style={styles.emoji}>🧒</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>This is a kid’s device</Text>
            <Text style={styles.cardSub}>Join my family with a code from a parent</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  wordmark: { fontSize: 28, fontWeight: '800', color: colors.text },
  middle: { flex: 1, justifyContent: 'center', gap: 14 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  emoji: { fontSize: 32 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: 14, color: colors.textMuted, marginTop: 2, lineHeight: 19 },
  chevron: { fontSize: 26, color: colors.textMuted },
});
