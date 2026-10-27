// Settings — reached via the gear icon on the child home screen.
// Redesigned from a 3-tab layout (Expected/Gigs/Account tabs crammed under
// a "Close" text link, with profile editing as a stray link above them)
// into the grouped-row-list pattern nearly every consumer app's settings
// uses (iOS Settings, Instagram, Spotify): a scrollable list of tappable
// rows, each leading to its own screen, with the profile row prominent at
// the top — the standard placement, which is also just where a parent
// looks first.
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert, Linking, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { AvatarGlyph } from '../../components/AvatarGlyph';
import { ChildChips } from '../../components/ChildChips';
import { signOut as signOutOfGoogle } from '../../services/googleAuth';
import { loadReminderSettings, hasNotificationPermission } from '../../services/dailyReminder';
import { formatTime12h } from '../../utils/time';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '../../services/analytics';
import { colors } from '../../theme/colors';
import { PRIVACY_URL, TERMS_URL } from '../../config';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

// One tight row inside a grouped card: icon, label, then either the current
// value and a chevron, or a control (a switch) on the right.
function SettingsRow({
  icon,
  label,
  value,
  onPress,
  control,
  attention,
  last,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  control?: React.ReactNode;
  attention?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.groupRow, !last && styles.groupRowDivider]}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.rowSpacer} />
      {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      {attention ? <View style={styles.attentionDot} /> : null}
      {control ?? (onPress ? <Text style={styles.chevron}>{'›'}</Text> : null)}
    </Pressable>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { childProfile, parentName, resetAllData, soundEnabled, setSoundEnabled, futureFund } = useAppData();
  const { isAutoAccount, accountEmail } = useAuth();
  const childFirstName = childProfile?.name?.trim().split(' ')[0];
  const [reminderSubtitle, setReminderSubtitle] = useState('Off');
  const [shareUsage, setShareUsage] = useState(true);
  React.useEffect(() => {
    isAnalyticsEnabled().then(setShareUsage);
  }, []);
  // Re-read on every return to this screen, since the reminder is edited on
  // its own sub-screen.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const stored = await loadReminderSettings();
        const on = stored.enabled && (await hasNotificationPermission());
        setReminderSubtitle(on ? `On · ${formatTime12h(stored.time)}` : 'Off');
      })();
    }, [])
  );

  const confirmResetAllData = () => {
    Alert.alert(
      'Reset all data',
      'This deletes everything — the child profile, schedule, Expected activities, gigs, goals, badges, and Future Fund balance — including your cloud backup, if this account is synced. It also fully disconnects this account, so signing back in with Google starts a brand new one instead of recovering this data. This cannot be undone.',
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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.sideSlot} />
        <Text style={styles.title}>Settings</Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>{'✕'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        {/* Which child's settings are shown below. */}
        <View style={styles.chipsWrap}>
          <ChildChips />
        </View>

        <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.profileRow}>
          <AvatarGlyph avatarId={childProfile?.avatarId} size={36} />
          <View style={styles.rowInfo}>
            <Text style={styles.profileName}>{childProfile?.name || 'Your child'}</Text>
            <Text style={styles.rowSubtitle}>{parentName ? `Parent: ${parentName}` : 'Add your name'}</Text>
          </View>
          <Text style={styles.chevron}>{'›'}</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>{childFirstName ? `${childFirstName}'s activities and money` : 'Activities and money'}</Text>
        <View style={styles.group}>
          <SettingsRow icon="🤝" label="Expected Activities" onPress={() => navigation.navigate('ExpectedItemsSettings')} />
          <SettingsRow icon="🪙" label="Gigs" onPress={() => navigation.navigate('GigsSettings')} />
          <SettingsRow
            icon="📈"
            label="Future Fund"
            value={futureFund && futureFund.percentage > 0 ? `${futureFund.percentage}% of every gig` : 'Off'}
            onPress={() => navigation.navigate('FutureFundSettings')}
          />
        </View>

        <Text style={styles.sectionLabel}>{childFirstName ? `${childFirstName}'s calendar and days` : 'Calendar and days'}</Text>
        <View style={styles.group}>
          <SettingsRow icon="🗓️" label="Schedule" onPress={() => navigation.navigate('ScheduleSettings')} />
          <SettingsRow icon="🌴" label="Excused days" onPress={() => navigation.navigate('ExcusedDaysSettings')} last />
        </View>

        <Text style={styles.sectionLabel}>Whole family</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="🔔"
            label="Daily reminder"
            value={reminderSubtitle}
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <SettingsRow
            icon="🔊"
            label="Sound effects"
            control={
              <Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ true: colors.expected }} />
            }
          />
          <SettingsRow
            icon="📊"
            label="Share anonymous usage ⓘ"
            onPress={() =>
              Alert.alert(
                'Share anonymous usage',
                'Helps improve the app. Never includes names or personal details.'
              )
            }
            control={
              <Switch
                value={shareUsage}
                onValueChange={(value) => {
                  setShareUsage(value);
                  setAnalyticsEnabled(value);
                }}
                trackColor={{ true: colors.expected }}
              />
            }
          />
          <SettingsRow
            icon="🔐"
            label="Account"
            value={isAutoAccount ? 'Add an email' : accountEmail ?? 'Signed in'}
            attention={isAutoAccount}
            onPress={() => navigation.navigate('AccountSettings')}
          />
          <SettingsRow icon="💬" label="Send feedback" onPress={() => navigation.navigate('Feedback')} last />
        </View>

        <View style={styles.legalRow}>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
        </View>

        {/* Developer conveniences — only in development builds (running through
         * Metro), never in a beta or store build. */}
        {__DEV__ && (
          <>
            <Text style={styles.sectionLabel}>Developer tools</Text>
            <Pressable style={styles.resetButton} onPress={confirmDisconnectGoogle}>
              <Text style={styles.resetButtonText}>Disconnect Google Calendar</Text>
            </Pressable>
            <Pressable style={[styles.resetButton, styles.resetButtonSpaced]} onPress={confirmResetAllData}>
              <Text style={styles.resetButtonText}>Reset all data</Text>
            </Pressable>
          </>
        )}
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
    marginTop: 18,
    marginBottom: 6,
  },
  chipsWrap: { marginHorizontal: -20, marginBottom: 12 },
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
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 },
  legalLink: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'underline' },
  legalDot: { fontSize: 13, color: colors.textMuted },
  group: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 14, minHeight: 48 },
  groupRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowSpacer: { flex: 1 },
  rowValue: { fontSize: 13, color: colors.textMuted, maxWidth: '45%' },
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
