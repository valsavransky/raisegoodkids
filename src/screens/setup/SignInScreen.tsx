// Reached right after Welcome — offers "Sign in with Google" as a
// skippable alternative to the invisible silent auto-account AuthContext
// already created on app launch. Signing in here replaces that throwaway
// account: an existing Google-linked account adopts its own server data
// (same as the typed-email Login screen), a brand-new one just continues
// setup as normal from here with a real identity from the start instead of
// needing "Secure your account" later.
//
// Google only, on purpose (no email/password form here) — that recovery
// path still exists via "Already set up Merit before? Log in" on the next
// screen for anyone who'd rather type credentials.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { isGoogleSignInConfigured, useGoogleSignInRequest, getIdToken } from '../../services/googleIdentityAuth';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'SignIn'>;
type Status = 'idle' | 'loading' | 'error';

export function SignInScreen({ navigation }: Props) {
  const { loginWithGoogle } = useAuth();
  const configured = isGoogleSignInConfigured();
  const [request, response, promptAsync] = useGoogleSignInRequest();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success' && response.type !== 'error') {
      // 'cancel' / 'dismiss' — just stop showing the spinner.
      setStatus('idle');
      return;
    }
    const idToken = getIdToken(response);
    if (!idToken) {
      setStatus('error');
      setError('Google did not return a usable sign-in — try again.');
      return;
    }
    loginWithGoogle(idToken).then((result) => {
      if (result.ok) {
        // If this account already had real data, AppDataContext's reconcile
        // effect adopts it the moment it sees the new token and the app
        // swaps out of the setup wizard on its own; otherwise this just
        // continues setup normally with a real identity from the start.
        navigation.replace('ChildProfile');
      } else {
        setStatus('error');
        setError(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handlePress = () => {
    setStatus('loading');
    setError('');
    promptAsync();
  };

  const skip = () => navigation.replace('ChildProfile');

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Sign in" step={1} totalSteps={4} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.explanation}>
          Sign in with Google to keep your data backed up under your own account from the start — or skip and set up
          fresh, you can always secure an account later from Settings.
        </Text>

        {configured ? (
          <Pressable
            style={styles.primaryButton}
            onPress={handlePress}
            disabled={!request || status === 'loading'}
          >
            {status === 'loading' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Continue with Google</Text>
            )}
          </Pressable>
        ) : (
          <Text style={styles.notConfiguredNote}>Google sign-in isn't set up for this build yet.</Text>
        )}

        {status === 'error' && <Text style={styles.errorText}>{error}</Text>}

        <Pressable style={styles.secondaryButton} onPress={skip}>
          <Text style={styles.secondaryButtonText}>Skip — set up fresh</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  explanation: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  notConfiguredNote: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 16 },
  secondaryButton: { marginTop: 16, paddingVertical: 12 },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
