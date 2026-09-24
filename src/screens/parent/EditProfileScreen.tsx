// Fixes a real gap: nothing after initial setup could correct a typo'd
// child name/birthday or set the parent's own name at all — the setup
// wizard's fields (ChildProfileScreen) were write-once. Same field set,
// same visual language, but editable afterward via a local draft + explicit
// Save (like the rest of Settings) rather than writing straight through on
// every keystroke.
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, Platform, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAppData } from '../../context/AppDataContext';
import { useSaveConfirmation } from '../../hooks/useSaveConfirmation';
import { GRADE_OPTIONS } from '../../data/contentLibrary';
import { AVATAR_OPTIONS } from '../../data/avatars';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

function eightYearsAgo(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 8);
  return d;
}

function eighteenYearsAgo(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
}

export function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { parentName, updateParentName, childProfile, updateChildProfile } = useAppData();

  const [parentNameDraft, setParentNameDraft] = useState(parentName ?? '');
  const [avatarId, setAvatarId] = useState(childProfile?.avatarId ?? '');
  const [name, setName] = useState(childProfile?.name ?? '');
  const [birthday, setBirthday] = useState(childProfile?.birthday ?? '');
  const [grade, setGrade] = useState(childProfile?.grade);
  const [hasYard, setHasYard] = useState(childProfile?.hasYard);
  const [hasCar, setHasCar] = useState(childProfile?.hasCar);
  const [hasPet, setHasPet] = useState(childProfile?.hasPet);
  const [petType, setPetType] = useState(childProfile?.petType ?? '');
  const [petName, setPetName] = useState(childProfile?.petName ?? '');

  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(eightYearsAgo());
  const { saved, showSavedThenGoBack } = useSaveConfirmation(() => navigation.navigate('Settings'));

  const parsedBirthday = birthday ? new Date(`${birthday}T00:00:00`) : null;
  const formattedBirthday = parsedBirthday
    ? parsedBirthday.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const canSave = useMemo(() => name.trim().length > 0 && birthday.length > 0, [name, birthday]);

  const openPicker = () => {
    setTempDate(parsedBirthday ?? eightYearsAgo());
    setShowPicker(true);
  };

  const handleAndroidChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    setShowPicker(false);
    setBirthday(selectedDate.toISOString().slice(0, 10));
  };

  const confirmIOSDate = () => {
    setBirthday(tempDate.toISOString().slice(0, 10));
    setShowPicker(false);
  };

  const save = () => {
    if (!canSave) return;
    updateParentName(parentNameDraft);
    updateChildProfile({
      avatarId,
      name: name.trim(),
      birthday,
      grade,
      hasYard,
      hasCar,
      hasPet,
      petType: hasPet ? petType : undefined,
      petName: hasPet ? petName : undefined,
    });
    showSavedThenGoBack();
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Edit Profile" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="Parent's name (optional)"
          value={parentNameDraft}
          onChangeText={(t) => {
            setParentNameDraft(t);
          }}
        />

        <Text style={[styles.label, styles.sectionLabel]}>Child's avatar</Text>
        <View style={styles.avatarRow}>
          {AVATAR_OPTIONS.map((avatar) => {
            const selected = avatarId === avatar.id;
            return (
              <Pressable
                key={avatar.id}
                onPress={() => {
                  setAvatarId(avatar.id);
                }}
                style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
              >
                <avatar.Icon size={40} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Child's name</Text>
        <TextInput
          style={styles.input}
          placeholder="Child's name"
          value={name}
          onChangeText={(t) => {
            setName(t);
          }}
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
            display="calendar"
            maximumDate={new Date()}
            minimumDate={eighteenYearsAgo()}
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
                  display="inline"
                  maximumDate={new Date()}
                  minimumDate={eighteenYearsAgo()}
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
        <View style={styles.chipRow}>
          {GRADE_OPTIONS.map((g) => {
            const selected = grade === g;
            return (
              <Pressable
                key={g}
                onPress={() => {
                  setGrade(selected ? undefined : g);
                }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{g}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, styles.sectionLabel]}>At home</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Yard</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => {
                setHasYard(true);
              }}
              style={[styles.chip, hasYard === true && styles.chipSelected]}
            >
              <Text style={[styles.chipText, hasYard === true && styles.chipTextSelected]}>Yes</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setHasYard(false);
              }}
              style={[styles.chip, hasYard === false && styles.chipSelected]}
            >
              <Text style={[styles.chipText, hasYard === false && styles.chipTextSelected]}>No</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Car</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => {
                setHasCar(true);
              }}
              style={[styles.chip, hasCar === true && styles.chipSelected]}
            >
              <Text style={[styles.chipText, hasCar === true && styles.chipTextSelected]}>Yes</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setHasCar(false);
              }}
              style={[styles.chip, hasCar === false && styles.chipSelected]}
            >
              <Text style={[styles.chipText, hasCar === false && styles.chipTextSelected]}>No</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Pet</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => {
                setHasPet(true);
              }}
              style={[styles.chip, hasPet === true && styles.chipSelected]}
            >
              <Text style={[styles.chipText, hasPet === true && styles.chipTextSelected]}>Yes</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setHasPet(false);
                setPetType('');
                setPetName('');
              }}
              style={[styles.chip, hasPet === false && styles.chipSelected]}
            >
              <Text style={[styles.chipText, hasPet === false && styles.chipTextSelected]}>No</Text>
            </Pressable>
          </View>
        </View>

        {hasPet && (
          <View style={styles.petFieldsRow}>
            <TextInput
              style={[styles.input, styles.petInput]}
              placeholder="Type (e.g. dog)"
              value={petType}
              onChangeText={(t) => {
                setPetType(t);
              }}
            />
            <TextInput
              style={[styles.input, styles.petInput]}
              placeholder="Name (optional)"
              value={petName}
              onChangeText={(t) => {
                setPetName(t);
              }}
            />
          </View>
        )}

        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled, saved && styles.saveButtonSaved]}
          disabled={!canSave || saved}
          onPress={save}
        >
          <Text style={styles.saveButtonText}>{saved ? '✓ Saved' : 'Save'}</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 20, marginBottom: 8 },
  sectionLabel: { marginTop: 28 },
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
  saveButton: {
    marginTop: 32,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonSaved: { backgroundColor: colors.success },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDoneButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
