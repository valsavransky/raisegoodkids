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
import { View, Text, Pressable, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandHeader } from '../../components/BrandHeader';
import { GoogleLogo } from '../../components/GoogleLogo';
import { useAuth } from '../../context/AuthContext';
import { isGoogleSignInConfigured, useGoogleSignInRequest, getIdToken } from '../../services/googleIdentityAuth';
import { useTrackSetupStep } from '../../hooks/useTrackScreen';
import { track } from '../../services/analytics';
import { colors } from '../../theme/colors';
import { PRIVACY_URL, TERMS_URL } from '../../config';

// Remembers that this phone accepted the Terms and Privacy Policy, and when.
const CONSENT_KEY = 'merit.consent.v1';

type Props = NativeStackScreenProps<SetupStackParamList, 'SignIn'>;
type Status = 'idle' | 'loading' | 'error';

export function SignInScreen({ navigation }: Props) {
  useTrackSetupStep('sign_in');
  const insets = useSafeAreaInsets();
  const { loginWithGoogle } = useAuth();
  const configured = isGoogleSignInConfigured();
  const [request, response, promptAsync] = useGoogleSignInRequest();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const recordConsent = () => {
    AsyncStorage.setItem(CONSENT_KEY, JSON.stringify({ acceptedAt: new Date().toISOString() })).catch(() => {});
    track('consent_accepted');
  };

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
        track('signed_in', { method: 'google' });
        navigation.replace('ChildProfile');
      } else {
        setStatus('error');
        setError(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handlePress = () => {
    if (!agreed) return;
    recordConsent();
    setStatus('loading');
    setError('');
    promptAsync();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: 24 + insets.bottom }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={12}
        style={[styles.backButton, { top: insets.top + 12 }]}
      >
        <Text style={styles.backArrow}>{'←'}</Text>
      </Pressable>
      <BrandHeader />
      <View style={styles.content}>
        {configured && (
          <Pressable
            style={[styles.googleButton, !agreed && styles.disabled]}
            onPress={handlePress}
            disabled={!request || status === 'loading' || !agreed}
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

        <Pressable
          style={[styles.emailButton, !agreed && styles.disabled]}
          disabled={!agreed}
          onPress={() => {
            recordConsent();
            navigation.navigate('SignUpEmail');
          }}
        >
          <Text style={styles.emailButtonText}>Sign up with email</Text>
        </Pressable>

        <Pressable style={styles.consentRow} onPress={() => setAgreed((v) => !v)} hitSlop={6}>
          <View style={[styles.checkbox, agreed && styles.checkboxOn]}>{agreed && <Text style={styles.checkMark}>✓</Text>}</View>
          <Text style={styles.consentText}>
            I'm this child's parent or guardian, and I agree to the{' '}
            <Text style={styles.consentLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms of Service</Text> and{' '}
            <Text style={styles.consentLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>.
          </Text>
        </Pressable>

        {status === 'error' && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 28 },
  backButton: { position: 'absolute', left: 20 },
  backArrow: { fontSize: 20, color: colors.text },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
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
  disabled: { opacity: 0.4 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn: { backgroundColor: colors.expected, borderColor: colors.expected },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  consentText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  consentLink: { color: colors.expected, fontWeight: '700', textDecorationLine: 'underline' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
