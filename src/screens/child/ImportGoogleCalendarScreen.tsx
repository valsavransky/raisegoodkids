// Runtime counterpart to the setup wizard's calendar screens — reachable
// post-setup from the Schedule tab instead of only during the 3-step
// wizard, so there's no separate step indicator here. Unlike the wizard
// (which has a dedicated "Connect Google Calendar" screen before this
// one), this single screen handles both the connect step and the
// calendar-picker step, since jumping straight to a picker full of mock
// data isn't useful once real sign-in is configured.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { MOCK_CALENDARS } from '../../data/mockGoogleCalendar';
import {
  isGoogleCalendarConfigured,
  useGoogleAuthRequest,
  storeTokensFromAuthResult,
  getValidAccessToken,
  signOut,
} from '../../services/googleAuth';
import { fetchCalendarList, GoogleCalendarSummary, GoogleApiError } from '../../services/googleCalendarApi';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportGoogleCalendar'>;

export function ImportGoogleCalendarScreen({ navigation }: Props) {
  const configured = isGoogleCalendarConfigured();
  const [request, response, promptAsync] = useGoogleAuthRequest();
  const [connecting, setConnecting] = useState(false);
  const [phase, setPhase] = useState<'checking' | 'needsConnect' | 'loading' | 'ready'>('checking');
  const [calendars, setCalendars] = useState<GoogleCalendarSummary[]>(MOCK_CALENDARS);
  const [error, setError] = useState<string | null>(null);

  const loadRealCalendars = async () => {
    setPhase('loading');
    const token = await getValidAccessToken();
    console.log('[ImportGoogleCalendarScreen] loadRealCalendars: token=', token ? `${token.slice(0, 12)}...` : null);
    if (!token) {
      setPhase('needsConnect');
      return;
    }
    try {
      const real = await fetchCalendarList(token);
      console.log('[ImportGoogleCalendarScreen] fetchCalendarList succeeded, count=', real.length, real);
      setCalendars(real);
      setError(null);
      setPhase('ready');
    } catch (e) {
      console.log('[ImportGoogleCalendarScreen] fetchCalendarList threw:', e);
      if (e instanceof GoogleApiError && (e.status === 401 || e.status === 403)) {
        // 401 = dead token (expired/revoked); 403 here has consistently
        // meant a token missing the calendar scope, not "API disabled" —
        // either way, retrying with the same token forever won't help, so
        // clear it and prompt reconnection instead.
        await signOut();
        setError('Your Google connection needs to be reconnected.');
        setPhase('needsConnect');
        return;
      }
      setError('Could not load your calendars. Check your connection and try again.');
      setPhase('ready');
    }
  };

  useEffect(() => {
    if (!configured) {
      setCalendars(MOCK_CALENDARS);
      setPhase('ready');
      return;
    }
    loadRealCalendars();
    // Only check once on mount — a fresh sign-in is handled by the
    // response effect below instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('[ImportGoogleCalendarScreen] response changed:', response);
    if (!response) return;
    if (response.type === 'success') {
      storeTokensFromAuthResult(response).then((stored) => {
        setConnecting(false);
        if (stored) {
          loadRealCalendars();
        } else {
          setError('Google signed you in but did not return an access token. Try again.');
          setPhase('needsConnect');
        }
      });
    } else {
      setConnecting(false);
    }
  }, [response]);

  const handleConnect = () => {
    console.log('[ImportGoogleCalendarScreen] request.url about to open:', request?.url);
    // Shown on-screen rather than only logged — Metro's log stream over the
    // tunnel has been unreliable, this can't be affected by that. Waits for
    // the alert to be dismissed before opening the browser, so there's time
    // to actually read/copy the URL.
    Alert.alert('Debug: auth URL', request?.url ?? '(no request built yet — button should be disabled)', [
      {
        text: 'Continue to sign-in',
        onPress: () => {
          setConnecting(true);
          promptAsync();
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.closeButton}>Close</Text>
        </Pressable>
        <Text style={styles.title}>{phase === 'needsConnect' ? 'Connect Google Calendar' : 'Choose a calendar'}</Text>
        <View style={{ width: 44 }} />
      </View>

      {phase === 'checking' || phase === 'loading' ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : phase === 'needsConnect' ? (
        <View style={styles.connectContent}>
          <Text style={styles.explanation}>
            Sign in to pull school, practice, and extracurricular events from your calendar.
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Pressable style={styles.primaryButton} onPress={handleConnect} disabled={connecting || !request}>
            {connecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Connect Google Calendar</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.helperText}>Pick the calendar that has school, practice, and extracurriculars on it.</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <FlatList
            contentContainerStyle={styles.listContent}
            data={calendars}
            keyExtractor={(cal) => cal.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.calendarRow}
                onPress={() => navigation.navigate('ImportGoogleCalendarEvents', { calendarId: item.id })}
              >
                <Text style={styles.calendarIcon}>📆</Text>
                <Text style={styles.calendarName}>{item.name}</Text>
                <Text style={styles.chevron}>{'>'}</Text>
              </Pressable>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  closeButton: { fontSize: 15, color: colors.textMuted, width: 44 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  connectContent: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  explanation: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  helperText: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 20, marginBottom: 12 },
  errorText: { fontSize: 13, color: colors.danger, paddingHorizontal: 20, marginBottom: 12 },
  listContent: { paddingHorizontal: 20 },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  calendarIcon: { fontSize: 18 },
  calendarName: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  chevron: { fontSize: 16, color: colors.textMuted },
});
