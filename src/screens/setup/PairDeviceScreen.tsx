// A family device (a kid's tablet or an old phone) joins a parent's account by typing the
// 6-character code the parent made in Family devices. Done once; the device remembers.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { useDevice } from '../../context/DeviceContext';
import { pairFamilyDevice, ApiError } from '../../services/api';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'PairDevice'>;

export function PairDeviceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { pairWith } = useDevice();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = code.length === 6 && !busy;

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const { token } = await pairFamilyDevice(code, name.trim() || "Kid's device");
      await pairWith(token);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't connect. Check the internet connection and try again."
      );
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('WhoFor'))} hitSlop={10} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Join your family</Text>
        <Text style={styles.body}>
          Ask a parent to open <Text style={styles.bold}>Settings → Family devices → + Add</Text> on their phone. Then type the code here.
        </Text>

        <View style={styles.codeWrap}>
          <View style={styles.codeRow} pointerEvents="none">
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.codeBox, i === code.length && styles.codeBoxActive]}>
                <Text style={styles.codeChar}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </View>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            maxLength={6}
            style={styles.codeHidden}
            accessibilityLabel="Code from a parent"
          />
        </View>

        <Text style={styles.label}>NAME THIS DEVICE (OPTIONAL)</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Kitchen tablet"
          placeholderTextColor={colors.border}
          style={styles.input}
          maxLength={40}
        />

        {error && <Text style={styles.error}>{error}</Text>}
      </KeyboardAwareScrollView>
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <Pressable onPress={join} disabled={!ready} style={[styles.button, !ready && styles.buttonDisabled]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Connect</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  back: { paddingHorizontal: 24, paddingVertical: 8 },
  backText: { fontSize: 17, color: colors.expected, fontWeight: '600' },
  content: { paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 10 },
  body: { fontSize: 16, color: colors.textMuted, lineHeight: 23, marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7, color: colors.textMuted, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
    backgroundColor: '#fff',
  },
  bold: { fontWeight: '800', color: colors.text },
  codeWrap: { marginBottom: 12, height: 62 },
  codeRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  codeBox: { flex: 1, height: 62, borderRadius: 12, borderWidth: 2, borderColor: '#BFE3DD', backgroundColor: '#EAF6F4', alignItems: 'center', justifyContent: 'center' },
  codeBoxActive: { borderColor: colors.expected, backgroundColor: '#fff' },
  codeChar: { fontSize: 28, fontWeight: '800', color: '#0B6D63' },
  codeHidden: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0.02, fontSize: 28 },
  error: { color: '#B91C1C', marginTop: 14, fontSize: 15 },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  button: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
