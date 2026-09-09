// Runtime counterpart to src/screens/setup/GoogleCalendarPickerScreen.tsx —
// same STUBBED mock calendars, reachable post-setup from the Schedule tab
// instead of only during the setup wizard. No step indicator here since
// this isn't part of the 3-step wizard.
import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { MOCK_CALENDARS } from '../../data/mockGoogleCalendar';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportGoogleCalendar'>;

export function ImportGoogleCalendarScreen({ navigation }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.closeButton}>Close</Text>
        </Pressable>
        <Text style={styles.title}>Choose a calendar</Text>
        <View style={{ width: 44 }} />
      </View>
      <Text style={styles.helperText}>Pick the calendar that has school, practice, and extracurriculars on it.</Text>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={MOCK_CALENDARS}
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
  helperText: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 20, marginBottom: 12 },
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
