// Shared top bar (Merit logo + wordmark, tappable profile chip) — shown on
// every main tab screen, not just Home, for consistent branding and a
// settings entry point reachable from anywhere. The chip is the only
// settings entry — no separate gear icon — mirroring the profile chip in
// the wizard's ScreenHeader.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { AVATAR_EMOJI } from '../data/avatars';
import { Logo } from './Logo';
import { colors } from '../theme/colors';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { childProfile } = useAppData();
  const { isAutoAccount } = useAuth();

  const firstName = childProfile?.name?.trim().split(' ')[0];

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.brandRow}>
        <Logo size={26} />
        <Text style={styles.wordmark}>Merit</Text>
      </View>
      <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={8} style={styles.chip}>
        <Text style={styles.avatar}>{AVATAR_EMOJI[childProfile?.avatarId ?? ''] ?? '🙂'}</Text>
        {firstName && <Text style={styles.name}>{firstName}</Text>}
        {/* Nudges the parent toward the Account tab's "Secure your
         * account" flow — the account exists and is already backing up
         * data invisibly, so nothing else surfaces this on its own. */}
        {isAutoAccount && <View style={styles.chipDot} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontSize: 19, fontWeight: '800', color: colors.text },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingRight: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  avatar: { fontSize: 16 },
  name: { fontSize: 13, fontWeight: '700', color: colors.text },
  chipDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.gigs,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
});
