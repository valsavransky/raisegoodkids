// Screen 5: parent setup, step 2 of 3 — schedule import.
//
// "Connect Google Calendar" triggers a real Google sign-in once a client ID
// is configured for this platform (see app.json's extra.googleCalendar and
// src/services/googleAuth.ts) — otherwise it falls back to the stubbed
// picker/import flow (mock calendars from src/data/mockGoogleCalendar.ts),
// so this screen still works on Expo Go / unconfigured platforms.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { CalendarImportIntro } from '../../components/CalendarImportIntro';
import { CalendarPrivacyNote } from '../../components/CalendarPrivacyNote';
import { GoogleCalendarLogo } from '../../components/GoogleCalendarLogo';
import { useSetup } from '../../context/SetupContext';
import { useTrackSetupStep } from '../../hooks/useTrackScreen';
import { colors } from '../../theme/colors';
import { isGoogleCalendarConfigured, useGoogleAuthRequest, storeTokensFromAuthResult } from '../../services/googleAuth';

type Props = NativeStackScreenProps<SetupStackParamList, 'ScheduleImport'>;

export function ScheduleImportScreen({ navigation }: Props) {
  useTrackSetupStep('schedule');
  const { childProfile } = useSetup();
  const [connecting, setConnecting] = useState(false);
  const configured = isGoogleCalendarConfigured();
  const [request, response, promptAsync] = useGoogleAuthRequest();

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      storeTokensFromAuthResult(response)
        .then((stored) => {
          setConnecting(false);
          if (stored) {
            navigation.navigate('GoogleCalendarPicker');
          } else {
            Alert.alert(
              'Connection failed',
              'Google signed you in but did not return an access token. You can try again, or skip and add your schedule manually.'
            );
          }
        })
        .catch(() => {
          setConnecting(false);
          Alert.alert(
            'Connection failed',
            'Could not finish connecting to Google Calendar. You can try again, or skip and add your schedule manually.'
          );
        });
    } else {
      // 'cancel' / 'dismiss' / 'error' — just stop showing the spinner, no
      // need to alert on a plain cancel.
      setConnecting(false);
    }
  }, [response]);

  const handleConnect = () => {
    if (!configured || !request) {
      // Not configured for this platform yet — same stubbed picker as
      // before, using mock calendar data.
      navigation.navigate('GoogleCalendarPicker');
      return;
    }
    setConnecting(true);
    promptAsync();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Set up schedule"
        step={2}
        totalSteps={5}
        onBack={() => navigation.goBack()}
        childName={childProfile.name}
        childAvatarId={childProfile.avatarId}
        onPressProfile={() => navigation.navigate('ChildProfile')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.icon}>📅</Text>
        <CalendarImportIntro childName={childProfile.name} />

        <Pressable style={styles.primaryButton} onPress={handleConnect} disabled={connecting}>
          {connecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.connectRow}>
              <GoogleCalendarLogo size={22} />
              <Text style={styles.primaryButtonText}>Connect Google Calendar</Text>
            </View>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('ScheduleReview')}>
          <Text style={styles.secondaryButtonText}>Skip and add manually</Text>
        </Pressable>

        <CalendarPrivacyNote />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 40, marginBottom: 16 },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  connectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { marginTop: 16, paddingVertical: 12 },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  privacyNote: {
    marginTop: 28,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
