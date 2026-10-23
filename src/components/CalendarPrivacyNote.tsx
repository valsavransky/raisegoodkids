// Shown before a parent taps "Connect Google Calendar", so Google's broad
// permission wording ("see any calendar you can access") isn't a surprise.
// Google offers no way to grant access to a single calendar, so this says what
// the app actually does with the access.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function CalendarPrivacyNote() {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>About Google's permission</Text>
      <Text style={styles.body}>
        Google will say Trekker can see "any calendar you can access." It can't limit that to one calendar, so we
        only read titles and times from the one you pick. We never change anything.
      </Text>
      <Text style={styles.body}>Remove access any time at myaccount.google.com/permissions.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
    gap: 8,
  },
  heading: { fontSize: 13, fontWeight: '800', color: colors.text },
  body: { fontSize: 13, lineHeight: 19, color: colors.textMuted },
});
