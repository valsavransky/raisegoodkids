// Settings → Family devices: a tablet or an old phone where kids can see their
// trail and tap things done. A parent makes a short code here and types it once
// on the other device. Removing a device signs it out at once.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAuth } from '../../context/AuthContext';
import { useSheet, offlineSheet } from '../../components/SheetProvider';
import { createFamilyCode, listFamilyDevices, removeFamilyDevice } from '../../services/api';
import { FamilyDevice } from '../../types/models';
import { track } from '../../services/analytics';
import { formatShortDate } from '../../utils/date';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyDevices'>;

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** "Last seen 2 hours ago", and whether that counts as recent (a green dot). */
function lastSeenText(iso?: string | null): { text: string; recent: boolean } {
  if (!iso) return { text: 'Not opened yet', recent: false };
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 5) return { text: 'Last seen just now', recent: true };
  if (minutes < 60) return { text: `Last seen ${minutes} minutes ago`, recent: true };
  const hours = Math.round(minutes / 60);
  if (hours < 24) return { text: `Last seen ${hours} hour${hours === 1 ? '' : 's'} ago`, recent: false };
  return { text: `Last seen ${formatShortDate(iso.slice(0, 10))}`, recent: false };
}

export function FamilyDevicesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const sheet = useSheet();
  const [devices, setDevices] = useState<FamilyDevice[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [code, setCode] = useState<{ value: string; expiresAt: number } | null>(null);
  const [making, setMaking] = useState(false);
  const [now, setNow] = useState(Date.now());
  const knownCount = useRef(0);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const { devices: list } = await listFamilyDevices(token);
      setDevices(list);
      setLoadError(false);
      return list;
    } catch {
      setLoadError(true);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const makeCode = async () => {
    if (!token) return;
    setMaking(true);
    try {
      const result = await createFamilyCode(token);
      knownCount.current = devices?.length ?? 0;
      setCode({ value: result.code, expiresAt: new Date(result.expiresAt).getTime() });
      track('family_code_made');
    } catch {
      sheet.show(offlineSheet('Couldn’t make a code', 'The internet seems to be napping. Try again in a sec.'));
    } finally {
      setMaking(false);
    }
  };

  // While the code is showing: tick the countdown, and watch for the device connecting.
  useEffect(() => {
    if (!code) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const watch = setInterval(async () => {
      const list = await load();
      if (list && list.length > knownCount.current) {
        setCode(null);
        track('family_device_connected');
        sheet.show({
          emoji: '🎉',
          emojiBg: '#E4F7EA',
          title: `${list[list.length - 1].name} is in!`,
          body: 'Your kids can open their trails there and tap things done.',
          rows: [
            { icon: '👀', title: 'You stay in charge', small: 'Every tap comes to you for a yes.' },
            { icon: '🔒', title: 'No Settings, no money', small: 'Little hands can’t change a thing.' },
          ],
          actions: [{ label: 'Done' }, { label: 'Add another device', kind: 'link', onPress: makeCode }],
        });
      }
    }, 3000);
    return () => {
      clearInterval(tick);
      clearInterval(watch);
    };
  }, [code, load]);

  const confirmRemove = (device: FamilyDevice) => {
    sheet.show({
      subject: { icon: '📱', title: device.name, small: `Added ${formatShortDate(device.createdAt.slice(0, 10))}` },
      title: `Unplug ${device.name}?`,
      body: 'It signs out within a minute. Nothing is lost from your phone, and you can reconnect any time with a new code.',
      actions: [
        {
          label: 'Remove it',
          kind: 'danger',
          onPress: async () => {
            if (!token) return;
            try {
              await removeFamilyDevice(token, device.id);
              track('family_device_removed');
              load();
            } catch {
              sheet.show(offlineSheet('Couldn’t remove it', 'The internet seems to be napping. Try again in a sec.'));
            }
          },
        },
        { label: 'Keep it', kind: 'ghost' },
      ],
    });
  };

  const remaining = code ? code.expiresAt - now : 0;

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Family devices" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { flexGrow: 1 }]}>
        {devices === null && !loadError && <ActivityIndicator style={{ marginTop: 30 }} />}
        {loadError && devices === null && (
          <Text style={styles.error}>Couldn’t load your devices. The internet seems to be napping. Try again in a sec.</Text>
        )}

        {devices?.length === 0 && (
          <>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Text style={styles.heroEmoji}>📱</Text>
              </View>
              <Text style={styles.heroTitle}>Give the kids their own screen</Text>
              <Text style={styles.heroText}>
                Put Trekker on a tablet or an old phone. They check off their day there, and you say yes from here.
              </Text>
            </View>
            <View style={styles.steps}>
              {[
                ['On the other device, open Trekker and tap “This is a kid’s device”.'],
                ['Tap “Connect a device” below to get a code.'],
                ['Type the code in. That’s it!'],
              ].map(([text], i) => (
                <View key={i} style={[styles.step, i > 0 && styles.stepDivider]}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{text}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chips}>
              <Text style={styles.chip}>🔒 No Settings or money</Text>
              <Text style={styles.chip}>👀 You approve everything</Text>
            </View>
          </>
        )}

        {devices && devices.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>CONNECTED</Text>
            {devices.map((device) => {
              const seen = lastSeenText(device.lastSeenAt);
              return (
                <View key={device.id} style={styles.deviceRow}>
                  <View style={styles.deviceIconWrap}>
                    <Text style={styles.deviceIcon}>📱</Text>
                  </View>
                  <View style={styles.deviceText}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceMeta}>Added {formatShortDate(device.createdAt.slice(0, 10))}</Text>
                    <View style={styles.seenRow}>
                      <View style={[styles.seenDot, { backgroundColor: seen.recent ? colors.success : colors.border }]} />
                      <Text style={[styles.seenText, seen.recent && { color: '#0B6D63' }]}>{seen.text}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => confirmRemove(device)} hitSlop={10}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
              );
            })}
            <View style={styles.tip}>
              <Text style={styles.tipText}>💡 Kids tap, you approve. Anything they send shows up on your Today screen.</Text>
            </View>
          </>
        )}
      </ScrollView>

      {devices !== null && (
        <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
          <Pressable style={styles.connectButton} onPress={makeCode}>
            <Text style={styles.connectButtonText}>
              {devices.length === 0 ? 'Connect a device' : 'Connect another device'}
            </Text>
          </Pressable>
        </View>
      )}

      <Modal visible={making || code !== null} transparent animationType="fade" onRequestClose={() => setCode(null)}>
        <Pressable style={styles.backdrop} onPress={() => setCode(null)}>
          <Pressable style={[styles.card, { marginBottom: 20 + insets.bottom }]} onPress={() => {}}>
            <Text style={styles.cardTitle}>Let’s connect a device</Text>
            {code ? (
              <>
                <Text style={styles.cardText}>
                  1. On the other device, open Trekker and tap “Set up a family device”.{'\n'}2. Type in this code. It only works once.
                </Text>
                <View style={styles.codeRow}>
                  {code.value.split('').map((ch, i) => (
                    <View key={i} style={styles.codeBox}>
                      <Text style={styles.codeChar}>{ch}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.expires}>
                  {remaining > 0 ? `Waiting for the device… ${formatCountdown(remaining)} left` : 'This code has expired'}
                </Text>
                <Pressable style={styles.secondary} onPress={makeCode}>
                  <Text style={styles.secondaryText}>Make a new code</Text>
                </Pressable>
                <Pressable style={styles.close} onPress={() => setCode(null)}>
                  <Text style={styles.closeText}>Done</Text>
                </Pressable>
              </>
            ) : (
              <ActivityIndicator style={{ marginVertical: 30 }} />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  error: { fontSize: 14, color: colors.danger, textAlign: 'center', marginTop: 30, lineHeight: 20 },
  hero: { backgroundColor: '#E4F4F1', borderRadius: 22, padding: 20, alignItems: 'center', gap: 8, marginBottom: 14 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroEmoji: { fontSize: 26 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  heroText: { fontSize: 14.5, color: '#3D5F5A', textAlign: 'center', lineHeight: 21 },
  steps: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEE6D8', borderRadius: 18, paddingHorizontal: 16, marginBottom: 14 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  stepDivider: { borderTopWidth: 1, borderTopColor: '#F1EBDD' },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E4F4F1', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 13, fontWeight: '800', color: '#0B6D63' },
  stepText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, lineHeight: 22, marginTop: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEE6D8', borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12, fontSize: 13, fontWeight: '700', color: '#4B4F58', overflow: 'hidden' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7, color: colors.textMuted, marginBottom: 10 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEE6D8', borderRadius: 18, padding: 14, marginBottom: 12 },
  deviceIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  deviceIcon: { fontSize: 22 },
  deviceText: { flex: 1, gap: 2 },
  deviceName: { fontSize: 16, fontWeight: '800', color: colors.text },
  deviceMeta: { fontSize: 12.5, color: colors.textMuted },
  seenRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  seenDot: { width: 8, height: 8, borderRadius: 4 },
  seenText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  remove: { color: colors.textMuted, fontSize: 13.5, fontWeight: '800' },
  tip: { backgroundColor: '#FCEBD2', borderRadius: 16, padding: 14, marginTop: 4 },
  tipText: { fontSize: 13.5, lineHeight: 20, color: '#7A4A06', fontWeight: '600' },
  footer: { paddingHorizontal: 20, paddingTop: 10, backgroundColor: colors.background },
  connectButton: { backgroundColor: colors.expected, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  connectButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 22, gap: 14 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  cardText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  codeBox: { width: 42, height: 54, borderRadius: 10, backgroundColor: '#E4F4F1', borderWidth: 1.5, borderColor: '#9FD8D1', alignItems: 'center', justifyContent: 'center' },
  codeChar: { fontSize: 26, fontWeight: '800', color: '#0B6D63' },
  expires: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  secondary: { backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '700', color: colors.text },
  close: { alignItems: 'center', paddingVertical: 6 },
  closeText: { fontSize: 15, fontWeight: '700', color: colors.expected },
});
