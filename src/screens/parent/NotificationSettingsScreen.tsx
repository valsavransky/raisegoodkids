// Settings → Notifications → Daily reminder. A switch and a time; changes
// apply immediately (no Save button), like the sound switch on Settings. The
// phone's notification permission is asked for only when the switch is first
// turned on, after a short explanation, and a refusal turns the switch back
// off with a pointer to the phone's own settings. See
// src/services/dailyReminder.ts for how the reminder is scheduled.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert, Modal, Linking, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAppData } from '../../context/AppDataContext';
import { isSomethingDoneToday } from '../../hooks/useDailyReminderSync';
import {
  ReminderSettings,
  DEFAULT_REMINDER_TIME,
  loadReminderSettings,
  saveReminderSettings,
  requestNotificationPermission,
  hasNotificationPermission,
  syncDailyReminder,
  reminderBody,
  getReminderDiagnostics,
  sendTestReminder,
  ReminderDiagnostics,
} from '../../services/dailyReminder';
import { timeStringToDate, dateToTimeString, formatTime12h } from '../../utils/time';
import { track } from '../../services/analytics';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

export function NotificationSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { childProfile, expectedCompletions, gigCompletions } = useAppData();
  const [settings, setSettings] = useState<ReminderSettings>({ enabled: false, time: DEFAULT_REMINDER_TIME });
  const [loaded, setLoaded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(timeStringToDate(DEFAULT_REMINDER_TIME));
  const [diag, setDiag] = useState<ReminderDiagnostics | null>(null);
  const [testStatus, setTestStatus] = useState('');

  const refreshDiag = async () => setDiag(await getReminderDiagnostics());

  useEffect(() => {
    (async () => {
      const stored = await loadReminderSettings();
      // A reminder can't be on if the phone's permission was revoked since.
      const permitted = stored.enabled ? await hasNotificationPermission() : true;
      setSettings(permitted ? stored : { ...stored, enabled: false });
      setLoaded(true);
      refreshDiag();
    })();
  }, []);

  const apply = async (next: ReminderSettings) => {
    if (next.enabled !== settings.enabled) track(next.enabled ? 'reminder_enabled' : 'reminder_disabled');
    setSettings(next);
    await saveReminderSettings(next);
    await syncDailyReminder({
      childName: childProfile?.name,
      doneToday: isSomethingDoneToday(expectedCompletions, gigCompletions),
    });
    await refreshDiag();
  };

  const turnOn = () => {
    Alert.alert(
      'Want a gentle nudge?',
      "We'll send one reminder on days nothing has been checked off yet. Nothing else, ever.",
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Turn on reminders',
          onPress: async () => {
            const result = await requestNotificationPermission();
            if (result === 'granted') {
              await apply({ ...settings, enabled: true });
            } else {
              Alert.alert(
                'Notifications are off',
                "UpTrek can't send reminders until notifications are allowed in your phone's settings.",
                [
                  { text: 'Not now', style: 'cancel' },
                  { text: 'Open settings', onPress: () => Linking.openSettings() },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const onToggle = (value: boolean) => {
    if (value) turnOn();
    else apply({ ...settings, enabled: false });
  };

  const openPicker = () => {
    setTempTime(timeStringToDate(settings.time));
    setShowPicker(true);
  };

  const handleAndroidChange = (_e: DateTimePickerChangeEvent, selected?: Date) => {
    setShowPicker(false);
    if (selected) apply({ ...settings, time: dateToTimeString(selected) });
  };

  const confirmIOS = () => {
    setShowPicker(false);
    apply({ ...settings, time: dateToTimeString(tempTime) });
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Daily reminder" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Remind me if nothing's checked off</Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={onToggle}
            disabled={!loaded}
            trackColor={{ true: colors.expected }}
          />
        </View>

        {settings.enabled ? (
          <>
            <Pressable style={[styles.row, styles.rowSpaced]} onPress={openPicker}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Remind me at</Text>
              </View>
              <Text style={styles.timeValue}>{formatTime12h(settings.time)}</Text>
            </Pressable>

            <Text style={styles.previewLabel}>How it will look</Text>
            <View style={styles.preview}>
              <View style={styles.previewIcon}>
                <Text style={styles.previewIconText}>M</Text>
              </View>
              <View style={styles.previewText}>
                <Text style={styles.previewTitle}>UpTrek</Text>
                <Text style={styles.previewBody}>{reminderBody(childProfile?.name)}</Text>
              </View>
            </View>
            <Text style={styles.helper}>
              You'll get one reminder at this time if nothing has been checked off yet. Checking off anything cancels
              it for that day.
            </Text>
          </>
        ) : (
          <Text style={styles.helper}>Turn it on to get one gentle nudge on days nothing has been checked off yet.</Text>
        )}

        <Text style={styles.previewLabel}>Troubleshooting</Text>
        <View style={styles.diagBox}>
          <Text style={styles.diagLine}>
            Phone permission: {diag ? (diag.permissionGranted ? 'allowed' : 'not allowed') : '…'}
          </Text>
          <Text style={styles.diagLine}>
            Scheduled reminders:{' '}
            {diag ? (diag.scheduledDays.length > 0 ? diag.scheduledDays.join(', ') : 'none') : '…'}
          </Text>
          <Text style={styles.diagNote}>
            Today is skipped once anything has been checked off, or if the time has already passed.
          </Text>
          <Pressable
            style={styles.testButton}
            onPress={async () => {
              setTestStatus('Sending… close UpTrek or lock your phone and wait about 10 seconds.');
              const ok = await sendTestReminder(childProfile?.name);
              setTestStatus(ok ? 'Sent. Look for it in about 10 seconds.' : "Couldn't schedule the test.");
            }}
          >
            <Text style={styles.testButtonText}>Send a test reminder in 10 seconds</Text>
          </Pressable>
          {testStatus !== '' && <Text style={styles.diagNote}>{testStatus}</Text>}
        </View>
      </ScrollView>

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          onValueChange={handleAndroidChange}
          onDismiss={() => setShowPicker(false)}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)}>
            <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
              <DateTimePicker value={tempTime} mode="time" display="spinner" onValueChange={(_, d) => d && setTempTime(d)} />
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
  content: { paddingHorizontal: 20, paddingTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surface,
  },
  rowSpaced: { marginTop: 10 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  timeValue: { fontSize: 16, fontWeight: '800', color: colors.expected },
  helper: { fontSize: 12, color: colors.textMuted, marginTop: 14, lineHeight: 17 },
  previewLabel: { fontSize: 12, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 22, marginBottom: 8 },
  preview: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.background,
  },
  previewIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#AFA9EC', alignItems: 'center', justifyContent: 'center' },
  previewIconText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  previewText: { flex: 1 },
  previewTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  previewBody: { fontSize: 13, color: colors.text, marginTop: 2, lineHeight: 18 },
  diagBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, backgroundColor: colors.surface, gap: 6 },
  diagLine: { fontSize: 13, color: colors.text },
  diagNote: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  testButton: { marginTop: 6, borderWidth: 1, borderColor: colors.expected, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  testButtonText: { color: colors.expected, fontWeight: '700', fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalDoneButton: { marginTop: 8, backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalDoneButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
