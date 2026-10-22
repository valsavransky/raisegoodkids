// Screen 5: parent setup, step 2 of 3 — schedule import.
//
// "Connect Google Calendar" triggers a real Google sign-in once a client ID
// is configured for this platform (see app.json's extra.googleCalendar and
// src/services/googleAuth.ts) — otherwise it falls back to the stubbed
// picker/import flow (mock calendars from src/data/mockGoogleCalendar.ts),
// so this screen still works on Expo Go / unconfigured platforms.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup } from '../../context/SetupContext';
import { useTrackSetupStep } from '../../hooks/useTrackScreen';
import { colors } from '../../theme/colors';
import { childFirstName, childPossessive } from '../../utils/setupCopy';
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

      <View style={styles.content}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.explanation}>
          Pull in {childPossessive(childProfile.name)} weekly activities to help us suggest Expected items for them
          to track. It's quicker than typing them in, and nothing is added until you confirm.
        </Text>

        <View style={styles.stepsCard}>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Choose just one calendar, if you have more than one.</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              We pre-select the recurring events that mention {childFirstName(childProfile.name)}, so you don't
              have to hunt for them.
            </Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Uncheck anything you don't want, or add more yourself.</Text>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleConnect} disabled={connecting}>
          {connecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Connect Google Calendar</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('ScheduleReview')}>
          <Text style={styles.secondaryButtonText}>Skip and add manually</Text>
        </Pressable>

        <Text style={styles.privacyNote}>
          Only event titles and times are read. Nothing else is stored.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 40, marginBottom: 16 },
  explanation: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    gap: 12,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.expected,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
  },
  stepText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
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
