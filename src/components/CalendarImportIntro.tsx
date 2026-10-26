// The "pull in [child]'s activities" explanation and the 1-2-3 steps, shown
// above the Connect Google Calendar button on both the setup screen and the
// Settings → Schedule import screen so the two read identically.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { childFirstName, childPossessive } from '../utils/setupCopy';

export function CalendarImportIntro({ childName }: { childName: string | undefined }) {
  const first = childFirstName(childName);
  return (
    <>
      <Text style={styles.explanation}>
        Pull in {childPossessive(childName)} weekly activities to help us suggest Expected items for them to track.
        It's quicker than typing them in, and nothing is added until you confirm.
      </Text>

      <View style={styles.stepsCard}>
        <View style={styles.stepRow}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>Choose just one calendar, if you have more than one.</Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>
            We pre-select the recurring events that mention {first}, so you don't have to hunt for them.
          </Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Uncheck anything you don't want, or add more yourself.</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  explanation: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
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
});
