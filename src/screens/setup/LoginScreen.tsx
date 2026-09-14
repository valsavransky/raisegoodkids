// Setup wizard entry point for a parent who already secured an account on
// another device (or is reinstalling) — offers logging into that existing
// account instead of the default silent auto-create-a-new-account path.
// Only reachable from the very first wizard screen, before any local child
// profile exists, so a successful login's data-adopt in AppDataContext's
// reconcile effect can never clobber real local progress (see its
// `!childProfile` guard).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'Login'>;
type Status = 'idle' | 'loading' | 'error';

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) {
      setStatus('error');
      setError('Enter your email and password.');
      return;
    }
    setStatus('loading');
    const result = await login(email.trim(), password);
    if (result.ok) {
      // If this account has data, AppDataContext's reconcile effect adopts
      // it the moment it sees the new token, and the app swaps away from
      // the setup wizard on its own — no explicit navigation needed here
      // beyond returning to where "Log in instead" was tapped from.
      navigation.goBack();
    } else {
      setStatus('error');
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <ScreenHeader title="Log in" step={1} totalSteps={4} onBack={() => navigation.goBack()} />
      <View style={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        <Text style={styles.helper}>
          Already set up Merit on another phone? Log in to bring your data over instead of starting fresh.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setStatus('idle');
          }}
        />
        <View style={styles.passwordFieldWrap}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            textContentType="password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setStatus('idle');
            }}
          />
          <Pressable style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Text style={styles.linkAction}>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        {status === 'error' && <Text style={styles.errorText}>{error}</Text>}
        <Pressable style={styles.submitButton} onPress={submit} disabled={status === 'loading'}>
          <Text style={styles.submitButtonText}>{status === 'loading' ? 'Logging in…' : 'Log in'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  helper: { fontSize: 13, color: colors.textMuted, marginBottom: 20, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  passwordFieldWrap: { position: 'relative', justifyContent: 'center' },
  passwordToggle: { position: 'absolute', right: 14 },
  linkAction: { color: colors.expected, fontSize: 13, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  submitButton: {
    backgroundColor: colors.expected,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
