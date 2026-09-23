// Shared top bar (Merit logo + wordmark, tappable profile chip) — shown on
// every main tab screen, not just Home, for consistent branding and a
// settings entry point reachable from anywhere. The chip is the only
// settings entry — no separate gear icon — mirroring the profile chip in
// the wizard's ScreenHeader.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { AvatarGlyph } from './AvatarGlyph';
import { Logo } from './Logo';
import { colors } from '../theme/colors';

// A one-time, local-only (not synced — seeing it again on a second device
// is harmless) coachmark pointing at the profile chip, so a parent who
// never opens Settings on their own still discovers gigs/Expected/value
// editing lives there. Onboarding doesn't end with a natural "you're all
// set" moment to hang this off of, so it just shows the first time this
// header renders post-setup and stays dismissed forever after.
const SETTINGS_HINT_SEEN_KEY = 'merit.settingsHintSeen';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { childProfile } = useAppData();
  const { isAutoAccount } = useAuth();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SETTINGS_HINT_SEEN_KEY).then((seen) => {
      if (!cancelled && !seen) setShowHint(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    AsyncStorage.setItem(SETTINGS_HINT_SEEN_KEY, '1').catch(() => {});
  };

  const firstName = childProfile?.name?.trim().split(' ')[0];

  return (
    <View style={styles.wrap}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <Logo size={26} />
          <Text style={styles.wordmark}>Merit</Text>
        </View>
        <Pressable
          onPress={() => {
            if (showHint) dismissHint();
            navigation.navigate('Settings');
          }}
          hitSlop={8}
          style={styles.chip}
        >
          <AvatarGlyph avatarId={childProfile?.avatarId} size={20} />
          {firstName && <Text style={styles.name}>{firstName}</Text>}
          {/* Nudges the parent toward the Account tab's "Secure your
           * account" flow — the account exists and is already backing up
           * data invisibly, so nothing else surfaces this on its own. */}
          {isAutoAccount && <View style={styles.chipDot} />}
        </Pressable>
      </View>

      {showHint && (
        <View style={styles.hintAnchor}>
          <View style={styles.hintArrow} />
          <View style={styles.hintBubble}>
            <Text style={styles.hintText}>Tap here anytime to edit gigs, chores, or values.</Text>
            <Pressable onPress={dismissHint} hitSlop={6} style={styles.hintDismiss}>
              <Text style={styles.hintDismissText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  hintAnchor: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: -6,
    marginBottom: 10,
  },
  hintArrow: {
    width: 14,
    height: 14,
    backgroundColor: colors.text,
    transform: [{ rotate: '45deg' }],
    marginBottom: -7,
    marginRight: 22,
  },
  hintBubble: {
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 230,
  },
  hintText: { color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  hintDismiss: { marginTop: 8, alignSelf: 'flex-end' },
  hintDismissText: { color: '#fff', fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
});
