// Settings → Notifications. One page, grouped by who a notification is for: you, your family devices, and
// quiet hours. Changes apply at once (no Save button). The server sends the pushes (see server/src/push.ts);
// the daily reminder also keeps a local copy as a fallback for a phone that can't receive pushes yet.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Modal, Linking, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { isSomethingDoneToday, excusedDatesAhead } from '../../hooks/useDailyReminderSync';
import {
  saveReminderSettings,
  requestNotificationPermission,
  hasNotificationPermission,
  syncDailyReminder,
} from '../../services/dailyReminder';
import {
  NotificationSettings,
  NotificationSettingsUpdate,
  getNotificationSettings,
  saveNotificationSettings,
  sendTestPush,
} from '../../services/api';
import { registerParentPush, isPushActive } from '../../services/push';
import { timeStringToDate, dateToTimeString, formatTime12h } from '../../utils/time';
import { track } from '../../services/analytics';
import { colors } from '../../theme/colors';
import { useSheet, confirmSheet, noticeSheet, offlineSheet } from '../../components/SheetProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

const DEFAULTS: NotificationSettings = {
  parent: { requests: true, goals: true, daily: true, dailyTime: '18:00' },
  family: { answers: true, daily: true, dailyTime: '16:30' },
  quiet: { on: true, from: '21:00', until: '07:00' },
  tz: 'America/New_York',
};

type TimeTarget = 'parentDaily' | 'familyDaily' | 'quietFrom' | 'quietUntil';

function SwitchRow({ label, sub, value, onChange, divider }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; divider?: boolean }) {
  return (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.expected }} />
    </View>
  );
}

function TimeRow({ label, value, onPress, divider }: { label: string; value: string; onPress: () => void; divider?: boolean }) {
  return (
    <Pressable style={[styles.row, divider && styles.rowDivider]} onPress={onPress}>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Text style={styles.timeValue}>{value}</Text>
    </Pressable>
  );
}

export function NotificationSettingsScreen({ navigation }: Props) {
  const sheet = useSheet();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { childProfile, childProfiles, expectedCompletions, gigCompletions, isDayExcused } = useAppData();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [permitted, setPermitted] = useState(true);
  const [pickerFor, setPickerFor] = useState<TimeTarget | null>(null);
  const [tempTime, setTempTime] = useState<Date>(timeStringToDate('18:00'));
  const hasKids = childProfiles.length > 0;

  const load = useCallback(async () => {
    setPermitted(await hasNotificationPermission());
    if (token) {
      try {
        const { settings: stored } = await getNotificationSettings(token);
        setSettings(stored);
      } catch {
        // Offline: show the defaults; changes will try again when saved.
      }
    }
    setLoaded(true);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (update: NotificationSettingsUpdate) => {
    setSettings((prev) => ({
      ...prev,
      parent: { ...prev.parent, ...update.parent },
      family: { ...prev.family, ...update.family },
      quiet: { ...prev.quiet, ...update.quiet },
    }));
    if (update.parent && ('daily' in update.parent || 'dailyTime' in update.parent)) {
      // Keep the phone's own copy of the daily reminder in step, for when push isn't available.
      const next = { ...settings.parent, ...update.parent };
      await saveReminderSettings({ enabled: next.daily, time: next.dailyTime });
      await syncDailyReminder({
        childName: childProfiles.length === 1 ? childProfile?.name : undefined,
        doneToday: isSomethingDoneToday(expectedCompletions, gigCompletions),
        excusedDates: excusedDatesAhead(isDayExcused),
      });
    }
    if (!token) return;
    try {
      await saveNotificationSettings(token, update);
    } catch {
      sheet.show(offlineSheet('Couldn’t save that', 'The internet seems to be napping. Try again in a sec.'));
    }
  };

  const allowNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      setPermitted(true);
      if (token) await registerParentPush(token);
      track('push_allowed');
    } else {
      sheet.show(
        confirmSheet({
          emoji: '🔕',
          emojiBg: '#F1F2F5',
          title: 'Notifications are off',
          body: 'Trekker can’t send anything until notifications are allowed in your phone’s settings.',
          confirmLabel: 'Open settings',
          cancelLabel: 'Not now',
          onConfirm: () => Linking.openSettings(),
        })
      );
    }
  };

  const sendTest = async () => {
    if (!token) return;
    if (!(await isPushActive())) {
      sheet.show(
        noticeSheet({
          emoji: '🔔',
          emojiBg: '#E4F4F1',
          title: 'Not ready on this phone yet',
          body: 'This phone isn’t registered for notifications. Allow them above, and make sure Trekker is the latest version.',
        })
      );
      return;
    }
    try {
      const { sent } = await sendTestPush(token);
      sheet.show(
        noticeSheet({
          emoji: sent > 0 ? '📬' : '🤔',
          emojiBg: '#E4F4F1',
          title: sent > 0 ? 'Test sent' : 'Nothing to send to',
          body: sent > 0 ? 'It should arrive in a few seconds.' : 'No phone is registered for notifications yet.',
        })
      );
    } catch {
      sheet.show(offlineSheet('Couldn’t send a test', 'The internet seems to be napping. Try again in a sec.'));
    }
  };

  const timeValue = (target: TimeTarget): string =>
    target === 'parentDaily' ? settings.parent.dailyTime
    : target === 'familyDaily' ? settings.family.dailyTime
    : target === 'quietFrom' ? settings.quiet.from
    : settings.quiet.until;

  const applyTime = (target: TimeTarget, value: string) => {
    if (target === 'parentDaily') save({ parent: { dailyTime: value } });
    else if (target === 'familyDaily') save({ family: { dailyTime: value } });
    else if (target === 'quietFrom') save({ quiet: { from: value } });
    else save({ quiet: { until: value } });
  };

  const openPicker = (target: TimeTarget) => {
    setTempTime(timeStringToDate(timeValue(target)));
    setPickerFor(target);
  };

  const handleAndroidChange = (_e: DateTimePickerChangeEvent, selected?: Date) => {
    const target = pickerFor;
    setPickerFor(null);
    if (target && selected) applyTime(target, dateToTimeString(selected));
  };

  const confirmIOS = () => {
    const target = pickerFor;
    setPickerFor(null);
    if (target) applyTime(target, dateToTimeString(tempTime));
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Notifications" onBack={() => navigation.goBack()} />
      {!loaded ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
          {!permitted && (
            <Pressable style={styles.offCard} onPress={allowNotifications}>
              <Text style={styles.offTitle}>Notifications are off on this phone</Text>
              <Text style={styles.offBody}>Tap to allow them, so you hear when your kids send something.</Text>
            </Pressable>
          )}

          <Text style={styles.group}>FOR YOU</Text>
          <View style={styles.card}>
            <SwitchRow label="Kids send something" sub="Activities, gigs and goal ideas" value={settings.parent.requests} onChange={(v) => save({ parent: { requests: v } })} />
            <SwitchRow label="A kid reaches a goal" value={settings.parent.goals} onChange={(v) => save({ parent: { goals: v } })} divider />
            <SwitchRow label="Daily reminder" sub="If nothing has been done yet today" value={settings.parent.daily} onChange={(v) => save({ parent: { daily: v } })} divider />
            {settings.parent.daily && <TimeRow label="Remind me at" value={formatTime12h(timeValue('parentDaily'))} onPress={() => openPicker('parentDaily')} divider />}
          </View>

          {hasKids && (
            <>
              <Text style={styles.group}>FOR YOUR FAMILY DEVICES</Text>
              <View style={styles.card}>
                <SwitchRow label="Answers and rewards" sub="When you answer, or they earn a badge or goal" value={settings.family.answers} onChange={(v) => save({ family: { answers: v } })} />
                <SwitchRow label="Daily reminder" sub="If they haven’t started yet" value={settings.family.daily} onChange={(v) => save({ family: { daily: v } })} divider />
                {settings.family.daily && <TimeRow label="Remind them at" value={formatTime12h(timeValue('familyDaily'))} onPress={() => openPicker('familyDaily')} divider />}
              </View>
            </>
          )}

          <Text style={styles.group}>QUIET HOURS</Text>
          <View style={styles.card}>
            <SwitchRow label="Pause overnight" sub="Notifications wait until morning" value={settings.quiet.on} onChange={(v) => save({ quiet: { on: v } })} />
            {settings.quiet.on && (
              <>
                <TimeRow label="From" value={formatTime12h(timeValue('quietFrom'))} onPress={() => openPicker('quietFrom')} divider />
                <TimeRow label="Until" value={formatTime12h(timeValue('quietUntil'))} onPress={() => openPicker('quietUntil')} divider />
              </>
            )}
          </View>

          <Pressable style={styles.testButton} onPress={sendTest}>
            <Text style={styles.testButtonText}>Send a test notification</Text>
          </Pressable>
        </ScrollView>
      )}

      {pickerFor && Platform.OS === 'android' && (
        <DateTimePicker value={tempTime} mode="time" is24Hour={false} display="default" onValueChange={handleAndroidChange} onDismiss={() => setPickerFor(null)} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={pickerFor !== null} animationType="slide" transparent onRequestClose={() => setPickerFor(null)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPickerFor(null)}>
            <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
              <DateTimePicker value={tempTime} mode="time" display="spinner" is24Hour={false} onValueChange={(_, d) => d && setTempTime(d)} />
              <Pressable style={styles.modalDoneButton} onPress={confirmIOS}>
                <Text style={styles.modalDoneButtonText}>Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 6 },
  offCard: { backgroundColor: '#FCEBD2', borderRadius: 16, padding: 16, gap: 4, marginBottom: 8 },
  offTitle: { fontSize: 15, fontWeight: '800', color: '#7A4A06' },
  offBody: { fontSize: 13.5, color: '#7A4A06', lineHeight: 19 },
  group: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7, color: colors.textMuted, marginTop: 14, marginBottom: 6, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEE6D8', borderRadius: 18, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, minHeight: 52 },
  rowDivider: { borderTopWidth: 1, borderTopColor: '#F1EBDD' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12.5, color: colors.textMuted, lineHeight: 17 },
  timeValue: { fontSize: 16, fontWeight: '800', color: colors.expected },
  testButton: { alignItems: 'center', paddingVertical: 18 },
  testButtonText: { fontSize: 15, fontWeight: '800', color: colors.expected },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalDoneButton: { backgroundColor: colors.expected, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  modalDoneButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
