// Settings → Family devices: a tablet or an old phone where kids can see their
// trail and tap things done. A parent makes a short code here and types it once
// on the other device. Removing a device signs it out at once.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { AddPill } from '../../components/AddPill';
import { useAuth } from '../../context/AuthContext';
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

export function FamilyDevicesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
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
      Alert.alert('Couldn’t make a code', 'Check your connection and try again.');
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
        Alert.alert('Connected', `${list[list.length - 1].name} is now a family device.`);
      }
    }, 3000);
    return () => {
      clearInterval(tick);
      clearInterval(watch);
    };
  }, [code, load]);

  const confirmRemove = (device: FamilyDevice) => {
    Alert.alert(
      `Remove ${device.name}?`,
      'It signs out right away and can’t show your kids’ screens any more. You can set it up again with a new code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await removeFamilyDevice(token, device.id);
              track('family_device_removed');
              load();
            } catch {
              Alert.alert('Couldn’t remove it', 'Check your connection and try again.');
            }
          },
        },
      ]
    );
  };

  const remaining = code ? code.expiresAt - now : 0;

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Family devices" onBack={() => navigation.goBack()} action={<AddPill onPress={makeCode} />} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
        <Text style={styles.intro}>
          A family device is a tablet or an old phone where your kids see their trail and tap things done. You approve
          what they send from this phone. It can’t open Settings or change anything else.
        </Text>

        {devices === null && !loadError && <ActivityIndicator style={{ marginTop: 30 }} />}
        {loadError && devices === null && <Text style={styles.error}>Couldn’t load devices. Check your connection.</Text>}
        {devices?.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No family devices yet</Text>
            <Text style={styles.emptyText}>Install Trekker on the other device, choose “Set up a family device”, then tap + Add here for a code.</Text>
          </View>
        )}
        {devices?.map((device) => (
          <View key={device.id} style={styles.deviceRow}>
            <Text style={styles.deviceIcon}>📱</Text>
            <View style={styles.deviceText}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceMeta}>
                Added {formatShortDate(device.createdAt.slice(0, 10))}
                {device.lastSeenAt ? ` · last used ${formatShortDate(device.lastSeenAt.slice(0, 10))}` : ''}
              </Text>
            </View>
            <Pressable onPress={() => confirmRemove(device)} hitSlop={10}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Modal visible={making || code !== null} transparent animationType="fade" onRequestClose={() => setCode(null)}>
        <Pressable style={styles.backdrop} onPress={() => setCode(null)}>
          <Pressable style={[styles.card, { marginBottom: 20 + insets.bottom }]} onPress={() => {}}>
            <Text style={styles.cardTitle}>Enter this code on the other device</Text>
            {code ? (
              <>
                <Text style={styles.cardText}>
                  Install Trekker there, choose “Set up a family device”, then type this code.
                </Text>
                <View style={styles.codeRow}>
                  {code.value.split('').map((ch, i) => (
                    <View key={i} style={styles.codeBox}>
                      <Text style={styles.codeChar}>{ch}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.expires}>
                  {remaining > 0 ? `Expires in ${formatCountdown(remaining)}` : 'This code has expired'}
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
  intro: { fontSize: 13.5, color: colors.textMuted, lineHeight: 20, marginBottom: 14 },
  error: { fontSize: 14, color: colors.danger, textAlign: 'center', marginTop: 30 },
  empty: { alignItems: 'center', gap: 6, marginTop: 30, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  deviceIcon: { fontSize: 24 },
  deviceText: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '700', color: colors.text },
  deviceMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  remove: { color: colors.danger, fontSize: 14, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', paddingHorizontal: 16 },
  card: { backgroundColor: colors.background, borderRadius: 20, padding: 20 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  cardText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
  codeBox: { width: 42, height: 54, borderRadius: 10, backgroundColor: '#E4F4F1', borderWidth: 1.5, borderColor: '#9FD8D1', alignItems: 'center', justifyContent: 'center' },
  codeChar: { fontSize: 26, fontWeight: '800', color: '#0B6D63' },
  expires: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 12 },
  secondary: { backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  secondaryText: { fontSize: 14, fontWeight: '700', color: colors.text },
  close: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  closeText: { fontSize: 15, fontWeight: '700', color: colors.expected },
});
