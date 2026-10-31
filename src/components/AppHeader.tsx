// Shared top bar (Trekker logo + wordmark, tappable profile chip) — shown on
// every main tab screen, not just Home, for consistent branding and a
// settings entry point reachable from anywhere. The chip is the only
// settings entry — no separate gear icon — mirroring the profile chip in
// the wizard's ScreenHeader.
//
// The one-time "here's what Settings has" coachmarks used to live here,
// anchored to the chip — moved to ChildHomeScreen instead (see its
// SettingsHintBadge), floating near the goal card so they land somewhere a
// parent is actually looking, rather than the small corner chip. AppHeader
// stays a plain header.
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { AvatarGlyph } from './AvatarGlyph';
import { Logo } from './Logo';
import { ChildSwitcherSheet } from './ChildSwitcherSheet';
import { colors } from '../theme/colors';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { childProfile, childProfiles, viewingEveryone, setViewingEveryone } = useAppData();
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const { isAutoAccount } = useAuth();

  const hasSeveralChildren = childProfiles.length > 1;
  const firstName = hasSeveralChildren && viewingEveryone ? 'Everyone' : childProfile?.name?.trim().split(' ')[0];
  const goTo = (screen: 'Home') => (navigation as unknown as { navigate: (name: string) => void }).navigate(screen);

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <Logo size={26} />
          <Text style={styles.wordmark}>Trekker</Text>
        </View>
        {/* One child: this chip opens Settings. Several: it opens the switcher
         * (children, Everyone, Add child, Settings). */}
        <Pressable
          onPress={() => (hasSeveralChildren ? setSwitcherVisible(true) : navigation.navigate('Settings'))}
          hitSlop={8}
          style={styles.chip}
        >
          {hasSeveralChildren && viewingEveryone ? (
            <Text style={styles.everyoneIcon}>👪</Text>
          ) : (
            <AvatarGlyph avatarId={childProfile?.avatarId} size={20} />
          )}
          {firstName && <Text style={styles.name}>{firstName}{hasSeveralChildren ? ' ▾' : ''}</Text>}
          {/* Nudges the parent toward the Account tab's "Secure your
           * account" flow — the account exists and is already backing up
           * data invisibly, so nothing else surfaces this on its own. */}
          {isAutoAccount && <View style={styles.chipDot} />}
        </Pressable>
      </View>
      <ChildSwitcherSheet
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
        onEveryone={() => {
          setViewingEveryone(true);
          setSwitcherVisible(false);
          goTo('Home');
        }}
        onAddChild={() => {
          setSwitcherVisible(false);
          navigation.navigate('AddChild');
        }}
        onSettings={() => {
          setSwitcherVisible(false);
          navigation.navigate('Settings');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  everyoneIcon: { fontSize: 15 },
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
