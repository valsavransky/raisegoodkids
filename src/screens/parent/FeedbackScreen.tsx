// Settings → Send feedback. A free-text note (plus an optional line for how to
// reach the parent) sent to the Trekker team, who read it on the private admin
// page. This is deliberately typed content the parent chose to write — unlike
// usage events, which never carry anything typed — so the screen says exactly
// where it goes.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAuth } from '../../context/AuthContext';
import { sendFeedback } from '../../services/api';
import { getInstallId, track } from '../../services/analytics';
import { appVersionLabel } from '../../utils/appVersion';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;
type Status = 'idle' | 'sending' | 'sent' | 'error';

export function FeedbackScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const canSend = message.trim().length > 0 && status !== 'sending' && status !== 'sent';

  const send = async () => {
    if (!canSend) return;
    if (!token) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await sendFeedback(token, {
        installId: await getInstallId(),
        appVersion: appVersionLabel(),
        platform: Platform.OS,
        message: message.trim(),
        contact: contact.trim() || undefined,
      });
      track('feedback_sent');
      setStatus('sent');
      setTimeout(() => navigation.goBack(), 1400);
    } catch {
      setStatus('error');
    }
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Send feedback" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.helper}>
            What's working, what's confusing, what's missing? Anything helps. Your note goes straight to the Trekker
            team.
          </Text>

          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Your feedback"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={2000}
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (status === 'error') setStatus('idle');
            }}
          />

          <TextInput
            style={styles.input}
            placeholder="How can we reach you? (optional)"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={contact}
            onChangeText={setContact}
          />
          <Text style={styles.fine}>Only add this if you'd like a reply.</Text>

          <Pressable
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled, status === 'sent' && styles.sendButtonSent]}
            onPress={send}
            disabled={!canSend}
          >
            {status === 'sending' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>{status === 'sent' ? '✓ Sent — thank you!' : 'Send'}</Text>
            )}
          </Pressable>
          {status === 'error' && (
            <Text style={styles.errorText}>Couldn't send that. Check your connection and try again.</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  helper: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 16 },
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
  messageInput: { minHeight: 150 },
  fine: { fontSize: 12, color: colors.textMuted, marginTop: -6, marginBottom: 20 },
  sendButton: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonSent: { backgroundColor: colors.success, opacity: 1 },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 12 },
});
