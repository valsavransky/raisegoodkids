// Screen 4: parent setup, step 1 of 3 — child profile.
import React, { useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup } from '../../context/SetupContext';
import { GRADE_OPTIONS } from '../../data/contentLibrary';
import { colors } from '../../theme/colors';

const AVATAR_OPTIONS = [
  { id: 'avatar-1', emoji: '🦊' },
  { id: 'avatar-2', emoji: '🐱' },
  { id: 'avatar-3', emoji: '🐼' },
  { id: 'avatar-4', emoji: '🐸' },
  { id: 'avatar-5', emoji: '🦁' },
];

const BIRTHDAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type Props = NativeStackScreenProps<SetupStackParamList, 'ChildProfile'>;

export function ChildProfileScreen({ navigation }: Props) {
  const { childProfile, setChildProfile } = useSetup();

  const canContinue = useMemo(
    () => childProfile.name.trim().length > 0 && BIRTHDAY_PATTERN.test(childProfile.birthday),
    [childProfile.name, childProfile.birthday]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Add a child" step={1} totalSteps={3} />

      <Text style={styles.label}>Avatar</Text>
      <View style={styles.avatarRow}>
        {AVATAR_OPTIONS.map((avatar) => {
          const selected = childProfile.avatarId === avatar.id;
          return (
            <Pressable
              key={avatar.id}
              onPress={() => setChildProfile({ avatarId: avatar.id })}
              style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
            >
              <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Child's name"
        value={childProfile.name}
        onChangeText={(name) => setChildProfile({ name })}
      />

      <Text style={styles.label}>Birthday</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={childProfile.birthday}
        onChangeText={(birthday) => setChildProfile({ birthday })}
        keyboardType="numbers-and-punctuation"
      />

      <Text style={styles.label}>Grade in school (optional)</Text>
      <Text style={styles.helperText}>
        We use this to suggest age-appropriate responsibilities and gigs later in setup.
      </Text>
      <View style={styles.chipRow}>
        {GRADE_OPTIONS.map((grade) => {
          const selected = childProfile.grade === grade;
          return (
            <Pressable
              key={grade}
              onPress={() => setChildProfile({ grade: selected ? undefined : grade })}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{grade}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
        disabled={!canContinue}
        onPress={() => navigation.navigate('ScheduleImport')}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 20, marginBottom: 8 },
  helperText: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  avatarRow: { flexDirection: 'row', gap: 10 },
  avatarOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: { borderColor: colors.expected },
  avatarEmoji: { fontSize: 26 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.expected, borderColor: colors.expected },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  continueButton: {
    marginTop: 32,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: { opacity: 0.4 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
