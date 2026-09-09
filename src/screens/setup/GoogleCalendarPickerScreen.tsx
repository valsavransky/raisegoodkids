// STUBBED: shows mock calendars rather than the user's real Google account
// (see src/data/mockGoogleCalendar.ts). Lets the picker UX be built and
// tested in Expo Go now; a real "sign in with Google" step goes in front of
// this once OAuth is wired up.
import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { MOCK_CALENDARS } from '../../data/mockGoogleCalendar';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'GoogleCalendarPicker'>;

export function GoogleCalendarPickerScreen({ navigation }: Props) {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Choose a calendar" step={2} totalSteps={3} onBack={() => navigation.goBack()} />
      <Text style={styles.helperText}>Pick the calendar that has school, practice, and extracurriculars on it.</Text>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={MOCK_CALENDARS}
        keyExtractor={(cal) => cal.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.calendarRow}
            onPress={() => navigation.navigate('GoogleCalendarEvents', { calendarId: item.id })}
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
