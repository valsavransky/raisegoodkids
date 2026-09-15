// Screen 4: parent setup, step 1 of 3 — child profile.
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup } from '../../context/SetupContext';
import { GRADE_OPTIONS } from '../../data/contentLibrary';
import { AVATAR_OPTIONS } from '../../data/avatars';
import { colors } from '../../theme/colors';

function eightYearsAgo(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 8);
  return d;
}

type Props = NativeStackScreenProps<SetupStackParamList, 'ChildProfile'>;

export function ChildProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { childProfile, setChildProfile } = useSetup();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(eightYearsAgo());

  const parsedBirthday = childProfile.birthday ? new Date(`${childProfile.birthday}T00:00:00`) : null;
  const formattedBirthday = parsedBirthday
    ? parsedBirthday.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const canContinue = useMemo(
    () => childProfile.name.trim().length > 0 && childProfile.birthday.length > 0,
    [childProfile.name, childProfile.birthday]
  );

  const openPicker = () => {
    setTempDate(parsedBirthday ?? eightYearsAgo());
    setShowPicker(true);
  };

  const handleAndroidChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    setShowPicker(false);
    setChildProfile({ birthday: selectedDate.toISOString().slice(0, 10) });
  };

  const confirmIOSDate = () => {
    setChildProfile({ birthday: tempDate.toISOString().slice(0, 10) });
    setShowPicker(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
    >
      <ScreenHeader title="Add a child" step={1} totalSteps={4} />
      <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
        <Text style={styles.loginLinkText}>Already set up Merit before? Log in</Text>
      </Pressable>

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
      <Pressable style={styles.input} onPress={openPicker}>
        <Text style={formattedBirthday ? styles.dateText : styles.datePlaceholder}>
          {formattedBirthday ?? 'Select birthday'}
        </Text>
      </Pressable>

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={parsedBirthday ?? eightYearsAgo()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onValueChange={handleAndroidChange}
          onDismiss={() => setShowPicker(false)}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPicker(false)}>
            <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onValueChange={(_, date) => setTempDate(date)}
              />
              <Pressable style={styles.modalDoneButton} onPress={confirmIOSDate}>
                <Text style={styles.modalDoneButtonText}>Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}

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

      <Text style={styles.label}>At home</Text>
      <Text style={styles.helperText}>
        A couple of household details help us suggest the right Expected items and gigs later (like
        feeding a pet or raking leaves).
      </Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Yard</Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setChildProfile({ hasYard: true })}
            style={[styles.chip, childProfile.hasYard === true && styles.chipSelected]}
          >
            <Text style={[styles.chipText, childProfile.hasYard === true && styles.chipTextSelected]}>Yes</Text>
          </Pressable>
          <Pressable
            onPress={() => setChildProfile({ hasYard: false })}
            style={[styles.chip, childProfile.hasYard === false && styles.chipSelected]}
          >
            <Text style={[styles.chipText, childProfile.hasYard === false && styles.chipTextSelected]}>No</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Car</Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setChildProfile({ hasCar: true })}
            style={[styles.chip, childProfile.hasCar === true && styles.chipSelected]}
          >
            <Text style={[styles.chipText, childProfile.hasCar === true && styles.chipTextSelected]}>Yes</Text>
          </Pressable>
          <Pressable
            onPress={() => setChildProfile({ hasCar: false })}
            style={[styles.chip, childProfile.hasCar === false && styles.chipSelected]}
          >
            <Text style={[styles.chipText, childProfile.hasCar === false && styles.chipTextSelected]}>No</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Pet</Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setChildProfile({ hasPet: true })}
            style={[styles.chip, childProfile.hasPet === true && styles.chipSelected]}
          >
            <Text style={[styles.chipText, childProfile.hasPet === true && styles.chipTextSelected]}>Yes</Text>
          </Pressable>
          <Pressable
            onPress={() => setChildProfile({ hasPet: false, petType: undefined, petName: undefined })}
            style={[styles.chip, childProfile.hasPet === false && styles.chipSelected]}
          >
            <Text style={[styles.chipText, childProfile.hasPet === false && styles.chipTextSelected]}>No</Text>
          </Pressable>
        </View>
      </View>

      {childProfile.hasPet && (
        <View style={styles.petFieldsRow}>
          <TextInput
            style={[styles.input, styles.petInput]}
            placeholder="Type (e.g. dog)"
            value={childProfile.petType ?? ''}
            onChangeText={(petType) => setChildProfile({ petType })}
          />
          <TextInput
            style={[styles.input, styles.petInput]}
            placeholder="Name (optional)"
            value={childProfile.petName ?? ''}
            onChangeText={(petName) => setChildProfile({ petName })}
          />
        </View>
      )}

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
  loginLink: { alignSelf: 'flex-start', marginTop: 4, marginBottom: 4 },
  loginLinkText: { fontSize: 13, color: colors.expected, fontWeight: '600' },
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
  dateText: { fontSize: 16, color: colors.text },
  datePlaceholder: { fontSize: 16, color: colors.textMuted },
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
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  toggleLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
  petFieldsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  petInput: { flex: 1 },
  continueButton: {
    marginTop: 32,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: { opacity: 0.4 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalDoneButton: {
    marginTop: 8,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDoneButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
