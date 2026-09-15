// Settings — reached via the gear icon on the child home screen.
// Redesigned from a 3-tab layout (Expected/Gigs/Account tabs crammed under
// a "Close" text link, with profile editing as a stray link above them)
// into the grouped-row-list pattern nearly every consumer app's settings
// uses (iOS Settings, Instagram, Spotify): a scrollable list of tappable
// rows, each leading to its own screen, with the profile row prominent at
// the top — the standard placement, which is also just where a parent
// looks first.
import React from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { AVATAR_EMOJI } from '../../data/avatars';
import { signOut as signOutOfGoogle } from '../../services/googleAuth';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { childProfile, parentName, resetAllData } = useAppData();
  const { isAutoAccount, accountEmail } = useAuth();

  const confirmResetAllData = () => {
    Alert.alert(
      'Reset all data',
      'This deletes everything — the child profile, schedule, Expected items, gigs, goals, badges, and Future Fund balance — including your cloud backup, if this account is synced. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetAllData() },
      ]
    );
  };

  const confirmDisconnectGoogle = () => {
    Alert.alert(
      'Disconnect Google Calendar',
      'Clears the stored Google sign-in so the next calendar import prompts you to connect again. Does not touch schedule events already imported.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => signOutOfGoogle() },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.sideSlot} />
        <Text style={styles.title}>Settings</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>{'✕'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.profileRow}>
          <Text style={styles.profileAvatar}>{AVATAR_EMOJI[childProfile?.avatarId ?? ''] ?? '🙂'}</Text>
          <View style={styles.rowInfo}>
            <Text style={styles.profileName}>{childProfile?.name || 'Your child'}</Text>
            <Text style={styles.rowSubtitle}>{parentName ? `Parent: ${parentName}` : 'Add your name'}</Text>
          </View>
          <Text style={styles.chevron}>{'›'}</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Household</Text>
        <Pressable onPress={() => navigation.navigate('ExpectedItemsSettings')} style={styles.row}>
          <Text style={styles.rowIcon}>🤝</Text>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Expected Items</Text>
          </View>
          <Text style={styles.chevron}>{'›'}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('GigsSettings')} style={styles.row}>
          <Text style={styles.rowIcon}>🪙</Text>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Gigs</Text>
          </View>
          <Text style={styles.chevron}>{'›'}</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Account</Text>
        <Pressable onPress={() => navigation.navigate('AccountSettings')} style={styles.row}>
          <Text style={styles.rowIcon}>🔐</Text>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Account</Text>
            <Text style={styles.rowSubtitle}>{isAutoAccount ? 'Not secured yet' : accountEmail ?? 'Secured'}</Text>
          </View>
          {isAutoAccount && <View style={styles.attentionDot} />}
          <Text style={styles.chevron}>{'›'}</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Danger Zone</Text>
        <Pressable style={styles.resetButton} onPress={confirmDisconnectGoogle}>
          <Text style={styles.resetButtonText}>Disconnect Google Calendar</Text>
        </Pressable>
        <Pressable style={[styles.resetButton, styles.resetButtonSpaced]} onPress={confirmResetAllData}>
          <Text style={styles.resetButtonText}>Reset all data</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
  },
  sideSlot: { width: 32 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { fontSize: 15, color: colors.textMuted, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surface,
    gap: 12,
  },
  profileAvatar: { fontSize: 36 },
  profileName: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    marginBottom: 8,
    gap: 12,
  },
  rowIcon: { fontSize: 20, width: 24, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textMuted },
  attentionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gigs },
  resetButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  resetButtonSpaced: { marginTop: 10 },
});
