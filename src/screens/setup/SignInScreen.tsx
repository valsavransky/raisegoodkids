// Reached right after Welcome — offers "Sign in with Google" as a
// skippable alternative to the invisible silent auto-account AuthContext
// already created on app launch. Signing in here replaces that throwaway
// account: an existing Google-linked account adopts its own server data
// (same as the typed-email Login screen), a brand-new one just continues
// setup as normal from here with a real identity from the start instead of
// needing "Secure your account" later.
//
// Two options, centered: Google, or email (SignUpEmailScreen, which also
// links to the email log-in screen for a returning parent). No progress bar
// — account creation sits before step 1.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { GoogleLogo } from '../../components/GoogleLogo';
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

  return (
    <View style={styles.screen}>
      <ScreenHeader onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {configured && (
          <Pressable
            style={styles.googleButton}
            onPress={handlePress}
            disabled={!request || status === 'loading'}
          >
            {status === 'loading' ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <GoogleLogo size={20} />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable style={styles.emailButton} onPress={() => navigation.navigate('SignUpEmail')}>
          <Text style={styles.emailButtonText}>Sign up with email</Text>
        </Pressable>

        {status === 'error' && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 80 },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 15,
  },
  googleButtonText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emailButton: {
    width: '100%',
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emailButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
