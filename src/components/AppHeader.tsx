// Shared top bar (Merit logo + wordmark, avatar, settings gear) — shown on
// every main tab screen, not just Home, for consistent branding and a
// settings entry point reachable from anywhere.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../context/AppDataContext';
import { RootStackParamList } from '../navigation/types';
import { AVATAR_EMOJI } from '../data/avatars';
import { Logo } from './Logo';
import { colors } from '../theme/colors';

export function AppHeader() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { childProfile } = useAppData();

  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Logo size={32} />
        <Text style={styles.wordmark}>Merit</Text>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.avatar}>{AVATAR_EMOJI[childProfile?.avatarId ?? ''] ?? '🙂'}</Text>
        <Pressable onPress={() => navigation.navigate('ManageExpectedGigs')} hitSlop={12}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontSize: 22, fontWeight: '800', color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { fontSize: 28 },
  settingsIcon: { fontSize: 22 },
});
