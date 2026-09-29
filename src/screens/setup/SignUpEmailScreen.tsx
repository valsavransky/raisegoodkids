// "Sign up with email" — turns the silent auto-account AuthContext already
// created into a real email + password account (same claimAccount call as
// Settings → Account's "Secure my account"), then continues setup. A
// returning parent can jump to the email log-in screen instead.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'SignUpEmail'>;
type Status = 'idle' | 'saving' | 'error';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export function SignUpEmailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { claimAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const edit = (setter: (v: string) => void) => (text: string) => {
    setter(text);
    setStatus('idle');
  };

  const submit = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setStatus('error');
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setStatus('error');
      setError('Passwords don’t match.');
      return;
    }
    setStatus('saving');
    const result = await claimAccount(email.trim(), password);
    if (result.ok) {
      navigation.replace('ChildProfile');
    } else {
      setStatus('error');
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <ScreenHeader title="Sign up with email" onBack={() => navigation.goBack()} />
      <View style={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          value={email}
          onChangeText={edit(setEmail)}
        />
        <View style={styles.passwordFieldWrap}>
          <TextInput
            style={styles.input}
            placeholder="Password (8+ characters)"
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            value={password}
            onChangeText={edit(setPassword)}
          />
          <Pressable style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Text style={styles.linkAction}>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          secureTextEntry={!showPassword}
          textContentType="newPassword"
          value={confirm}
          onChangeText={edit(setConfirm)}
        />
        {status === 'error' && <Text style={styles.errorText}>{error}</Text>}
        <Pressable style={styles.submitButton} onPress={submit} disabled={status === 'saving'}>
          <Text style={styles.submitButtonText}>{status === 'saving' ? 'Signing up…' : 'Sign up'}</Text>
        </Pressable>
        <Pressable style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkAction}>Already have an account? Log in with email</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
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
  passwordToggle: { position: 'absolute', right: 14, top: 15 },
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
  loginLink: { alignItems: 'center', marginTop: 20 },
});
