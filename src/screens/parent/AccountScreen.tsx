// Settings → Account. Split out from the old ManageExpectedGigsScreen as
// part of the Settings redesign — its own screen now, reached from a row
// on the Settings list (which also shows a small amber dot there while
// still unsecured, mirroring the same nudge on the gear icon).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com'];

/** Suggests full-email completions once there's text after "@" — e.g.
 * "val@g" -> ["val@gmail.com"]. Empty once the domain is already spelled
 * out in full (no point suggesting what's already typed). */
function emailDomainSuggestions(input: string): string[] {
  const at = input.indexOf('@');
  if (at <= 0) return [];
  const local = input.slice(0, at);
  const domainSoFar = input.slice(at + 1);
  return EMAIL_DOMAINS.filter((d) => d !== domainSoFar && d.startsWith(domainSoFar)).map((d) => `${local}@${d}`);
}

type Props = NativeStackScreenProps<RootStackParamList, 'AccountSettings'>;
type Status = 'idle' | 'saving' | 'saved' | 'error';

export function AccountScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isAutoAccount, accountEmail, claimAccount } = useAuth();

  const [emailDraft, setEmailDraft] = useState('');
  const [passwordDraft, setPasswordDraft] = useState('');
  const [passwordConfirmDraft, setPasswordConfirmDraft] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const editField = (setter: (v: string) => void) => (text: string) => {
    setter(text);
    setStatus('idle');
  };

  const submit = async () => {
    if (!EMAIL_PATTERN.test(emailDraft.trim())) {
      setStatus('error');
      setError('Enter a valid email address.');
      return;
    }
    if (passwordDraft.length < 8) {
      setStatus('error');
      setError('Password must be at least 8 characters.');
      return;
    }
    if (passwordDraft !== passwordConfirmDraft) {
      setStatus('error');
      setError('Passwords don’t match.');
      return;
    }
    setStatus('saving');
    const result = await claimAccount(emailDraft.trim(), passwordDraft);
    if (result.ok) {
      setStatus('saved');
    } else {
      setStatus('error');
      setError(result.error);
    }
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Account" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        {isAutoAccount ? (
          <>
            <Text style={styles.helper}>
              Your data already backs up automatically. Set an email and password so you can also get to it from a
              new phone if you ever need to.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={emailDraft}
              onChangeText={editField(setEmailDraft)}
            />
            {emailDomainSuggestions(emailDraft).length > 0 && (
              <View style={styles.suggestionRow}>
                {emailDomainSuggestions(emailDraft).map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => editField(setEmailDraft)(suggestion)}
                  >
                    <Text style={styles.suggestionChipText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.passwordFieldWrap}>
              <TextInput
                style={styles.input}
                placeholder="Password (8+ characters)"
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                value={passwordDraft}
                onChangeText={editField(setPasswordDraft)}
              />
              <Pressable style={styles.passwordToggle} onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Text style={styles.linkAction}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            <View style={styles.passwordFieldWrap}>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                secureTextEntry={!showPasswordConfirm}
                textContentType="newPassword"
                value={passwordConfirmDraft}
                onChangeText={editField(setPasswordConfirmDraft)}
              />
              <Pressable style={styles.passwordToggle} onPress={() => setShowPasswordConfirm((v) => !v)} hitSlop={8}>
                <Text style={styles.linkAction}>{showPasswordConfirm ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.saveButton, status === 'saved' && styles.saveButtonSaved]}
              onPress={submit}
              disabled={status === 'saving'}
            >
              <Text style={[styles.saveButtonText, status === 'saved' && styles.saveButtonTextSaved]}>
                {status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ Secured' : 'Secure my account'}
              </Text>
            </Pressable>
            {status === 'error' && <Text style={styles.errorText}>{error}</Text>}
          </>
        ) : (
          <Text style={styles.helper}>
            ✓ Account secured{accountEmail ? ` — ${accountEmail}` : ''}. You can log in with this email on another
            phone if you ever need to.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  helper: { fontSize: 12, color: colors.textMuted, marginBottom: 10, lineHeight: 17 },
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
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -6, marginBottom: 12 },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionChipText: { fontSize: 12, color: colors.textMuted },
  passwordFieldWrap: { position: 'relative', justifyContent: 'center' },
  passwordToggle: { position: 'absolute', right: 14 },
  linkAction: { color: colors.expected, fontSize: 13, fontWeight: '700' },
  saveButton: { marginTop: 12, borderWidth: 1, borderColor: colors.gigs, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveButtonSaved: { borderColor: colors.success, backgroundColor: colors.success },
  saveButtonText: { color: colors.gigs, fontSize: 14, fontWeight: '700' },
  saveButtonTextSaved: { color: '#fff' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 10 },
});
