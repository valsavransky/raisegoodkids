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
import { EveryoneIcon } from './EveryoneIcon';
import { useApprovals } from '../context/ApprovalsContext';
import { colors } from '../theme/colors';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { childProfile, childProfiles, viewingEveryone, setViewingEveryone, deviceMode } = useAppData();
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const { isAutoAccount } = useAuth();
  const { waitingCount } = useApprovals();

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
          onPress={() => {
            if (hasSeveralChildren) setSwitcherVisible(true);
            else if (!deviceMode) navigation.navigate('Settings');
          }}
          hitSlop={8}
          style={styles.chip}
        >
          {hasSeveralChildren && viewingEveryone ? (
            <EveryoneIcon size={18} />
          ) : (
            <AvatarGlyph avatarId={childProfile?.avatarId} size={20} />
          )}
          {firstName && <Text style={styles.name}>{firstName}{hasSeveralChildren ? ' ▾' : ''}</Text>}
          {/* Nudges the parent toward the Account tab's "Secure your
           * account" flow — the account exists and is already backing up
           * data invisibly, so nothing else surfaces this on its own. */}
          {!deviceMode && isAutoAccount && waitingCount === 0 && <View style={styles.chipDot} />}
          {/* How many things children have sent in, waiting for a parent. */}
          {waitingCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{waitingCount > 9 ? '9+' : waitingCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
      <ChildSwitcherSheet
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
        onEveryone={
          deviceMode
            ? undefined
            : () => {
                setViewingEveryone(true);
                setSwitcherVisible(false);
                goTo('Home');
              }
        }
        onAddChild={
          deviceMode
            ? undefined
            : () => {
                setSwitcherVisible(false);
                navigation.navigate('AddChild');
              }
        }
        onSettings={
          deviceMode
            ? undefined
            : () => {
                setSwitcherVisible(false);
                navigation.navigate('Settings');
              }
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
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
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.gigs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  countBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
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
