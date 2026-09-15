// The very first thing a brand-new parent sees — before any setup starts,
// so nothing here can be personalized with the child's name yet (that's
// step 1, right after this). Explains what Merit actually is and why the
// Expected/Gigs split exists, since nothing else in the flow did before
// this screen existed (see the "Splash/start screen needs real content"
// item in docs/screens-and-flows.md's Known follow-ups).
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { Logo } from '../../components/Logo';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
    >
      <View style={styles.brandRow}>
        <Logo size={56} />
        <Text style={styles.wordmark}>Merit</Text>
      </View>

      <Text style={styles.headline}>Raise a well-rounded, responsible kid who knows the value of hard work.</Text>

      <Text style={styles.body}>
        In a world of instant gratification and one-tap purchases, it's easy to lose sight of what
        work is actually worth.
      </Text>
      <Text style={styles.body}>
        Being part of this family — school, chores, showing up — is simply expected, not a paid
        job. Anything extra is a gig: real work that earns real progress toward a goal they choose.
      </Text>
      <Text style={styles.body}>
        Along the way, they'll learn to save first, watch their money grow, and spend what they've
        actually earned — never just a lecture about money.
      </Text>

      <Pressable style={styles.getStartedButton} onPress={() => navigation.navigate('ChildProfile')}>
        <Text style={styles.getStartedButtonText}>Get started</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: 48, flexGrow: 1, justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 },
  wordmark: { fontSize: 26, fontWeight: '800', color: colors.text },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  body: { fontSize: 15, color: colors.textMuted, lineHeight: 21, marginBottom: 14 },
  getStartedButton: {
    marginTop: 24,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  getStartedButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
