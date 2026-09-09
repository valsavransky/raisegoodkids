// Screen 5: parent setup, step 2 of 3 — schedule import.
//
// Google Calendar connection isn't wired up yet (needs OAuth + a backend,
// neither of which exist in this build) — "Connect Google Calendar" says so
// rather than pretending to import anything. "Skip and add manually" is the
// only functional path into schedule review for now.
import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'ScheduleImport'>;

export function ScheduleImportScreen({ navigation }: Props) {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Set up schedule" step={2} totalSteps={3} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.explanation}>
          Knowing school, extracurriculars, and practice helps us suggest a realistic amount of
          Expected items and Gigs.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            Alert.alert(
              'Coming soon',
              'Google Calendar connection isn’t available yet. Continue with "Skip and add manually" for now.'
            )
          }
        >
          <Text style={styles.primaryButtonText}>Connect Google Calendar</Text>
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
  secondaryButton: { marginTop: 16, paddingVertical: 12 },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  privacyNote: {
    marginTop: 28,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
