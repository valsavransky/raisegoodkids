// Shows the real Google calendar list once signed in (see
// ScheduleImportScreen); falls back to the STUBBED mock calendars from
// src/data/mockGoogleCalendar.ts when not configured/signed in, so this
// screen still works on Expo Go / unconfigured platforms.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { MOCK_CALENDARS } from '../../data/mockGoogleCalendar';
import { getValidAccessToken } from '../../services/googleAuth';
import { fetchCalendarList, GoogleCalendarSummary } from '../../services/googleCalendarApi';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'GoogleCalendarPicker'>;

export function GoogleCalendarPickerScreen({ navigation }: Props) {
  const [calendars, setCalendars] = useState<GoogleCalendarSummary[]>(MOCK_CALENDARS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getValidAccessToken();
      if (!token) {
        // Not signed in — stay on the mock list.
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const real = await fetchCalendarList(token);
        if (!cancelled) setCalendars(real);
      } catch {
        if (!cancelled) setError('Could not load your calendars. Check your connection and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Choose a calendar" step={2} totalSteps={3} onBack={() => navigation.goBack()} />
      <Text style={styles.helperText}>Pick the calendar that has school, practice, and extracurriculars on it.</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={calendars}
          keyExtractor={(cal) => cal.id}
          ListEmptyComponent={<Text style={styles.errorText}>No calendars found on this account.</Text>}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  helperText: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 20, marginBottom: 12 },
  errorText: { fontSize: 13, color: colors.danger, paddingHorizontal: 20, marginBottom: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
