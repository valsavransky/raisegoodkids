// Add another child to the household: name, avatar, birthday and grade, plus
// activity and gig suggestions for that grade the parent can untick. Household
// details (yard, car, pet) carry over from the first child.
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, Platform, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { KeyboardAwareScrollView } from '../../components/KeyboardAwareScrollView';
import { useAppData } from '../../context/AppDataContext';
import { GRADE_OPTIONS, getContentLibraryForGrade, suggestMoreGigs } from '../../data/contentLibrary';
import { AVATAR_OPTIONS } from '../../data/avatars';
import { colors } from '../../theme/colors';
import { toLocalDateString } from '../../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'AddChild'>;

function yearsAgo(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

export function AddChildScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { childProfiles, addChild } = useAppData();
  const household = childProfiles[0];

  const [avatarId, setAvatarId] = useState(
    () => AVATAR_OPTIONS.find((a) => !childProfiles.some((c) => c.avatarId === a.id))?.id ?? AVATAR_OPTIONS[0].id
  );
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [grade, setGrade] = useState<string | undefined>();
  // Suggestions start ticked; this holds the ones the parent unticked.
  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(yearsAgo(8));

  const parsedBirthday = birthday ? new Date(`${birthday}T00:00:00`) : null;
  const formattedBirthday = parsedBirthday
    ? parsedBirthday.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const expectedSuggestions = useMemo(() => getContentLibraryForGrade(grade)?.expectedItems ?? [], [grade]);
  const gigSuggestions = useMemo(
    () => (grade ? suggestMoreGigs({ ...household, grade }, [], 5) : []),
    [grade, household]
  );
  const canAdd = name.trim().length > 0 && !!birthday && !!grade;

  const toggle = (key: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const pickGrade = (g: string) => {
    setGrade(g);
    setUnticked(new Set());
  };

  const openPicker = () => {
    setTempDate(parsedBirthday ?? yearsAgo(8));
    setShowPicker(true);
  };

  const save = () => {
    if (!canAdd) return;
    addChild({
      name,
      avatarId,
      birthday,
      grade,
      expectedItems: expectedSuggestions.filter((i) => !unticked.has(`e:${i.name}`)),
      gigs: gigSuggestions.filter((g) => !unticked.has(`g:${g.name}`)).map((g) => ({ name: g.name, effortTier: g.effortTier })),
    });
    navigation.navigate('MainTabs');
  };

  const SuggestionRow = ({ keyName, label }: { keyName: string; label: string }) => {
    const on = !unticked.has(keyName);
    return (
      <Pressable style={styles.suggestionRow} onPress={() => toggle(keyName)}>
        <View style={[styles.check, on && styles.checkOn]}>{on && <Text style={styles.checkMark}>✓</Text>}</View>
        <Text style={styles.suggestionText}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Add a child" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardAwareScrollView
          avoid={false}
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Avatar</Text>
          <View style={styles.avatarRow}>
            {AVATAR_OPTIONS.map((avatar) => (
              <Pressable
                key={avatar.id}
                onPress={() => setAvatarId(avatar.id)}
                style={[styles.avatarOption, avatarId === avatar.id && styles.avatarOptionSelected]}
              >
                <avatar.Icon size={40} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} placeholder="Child's name" value={name} onChangeText={setName} />

          <Text style={styles.label}>Birthday</Text>
          <Text style={styles.helper}>Used for a birthday celebration on the day.</Text>
          <Pressable style={styles.input} onPress={openPicker}>
            <Text style={formattedBirthday ? styles.dateText : styles.datePlaceholder}>
              {formattedBirthday ?? 'Select birthday'}
            </Text>
          </Pressable>
          {showPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={parsedBirthday ?? yearsAgo(8)}
              mode="date"
              display="calendar"
              maximumDate={new Date()}
              minimumDate={yearsAgo(18)}
              onValueChange={(_e: DateTimePickerChangeEvent, date: Date) => {
                setShowPicker(false);
                setBirthday(toLocalDateString(date));
              }}
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
                    minimumDate={yearsAgo(18)}
                    onValueChange={(_, date) => setTempDate(date)}
                  />
                  <Pressable
                    style={styles.modalDone}
                    onPress={() => {
                      setBirthday(toLocalDateString(tempDate));
                      setShowPicker(false);
                    }}
                  >
                    <Text style={styles.modalDoneText}>Done</Text>
                  </Pressable>
                </Pressable>
              </Pressable>
            </Modal>
          )}

          <Text style={styles.label}>Grade in school</Text>
          <View style={styles.chipRow}>
            {GRADE_OPTIONS.map((g) => (
              <Pressable key={g} onPress={() => pickGrade(g)} style={[styles.chip, grade === g && styles.chipSelected]}>
                <Text style={[styles.chipText, grade === g && styles.chipTextSelected]}>{g}</Text>
              </Pressable>
            ))}
          </View>

          {expectedSuggestions.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Suggested Expected activities</Text>
              {expectedSuggestions.map((i) => (
                <SuggestionRow key={i.name} keyName={`e:${i.name}`} label={i.name} />
              ))}
            </>
          )}
          {gigSuggestions.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Suggested gigs</Text>
              {gigSuggestions.map((g) => (
                <SuggestionRow key={g.name} keyName={`g:${g.name}`} label={g.name} />
              ))}
            </>
          )}
          {grade && (
            <Text style={styles.helper}>You can change any of these later in Settings.</Text>
          )}

          <Pressable style={[styles.addButton, !canAdd && styles.addButtonDisabled]} disabled={!canAdd} onPress={save}>
            <Text style={styles.addButtonText}>{name.trim() ? `Add ${name.trim()}` : 'Add child'}</Text>
          </Pressable>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 20, marginBottom: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 4,
  },
  helper: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
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
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.expected, borderColor: colors.expected },
  checkMark: { color: '#fff', fontSize: 13, fontWeight: '800' },
  suggestionText: { flex: 1, fontSize: 15, color: colors.text },
  addButton: {
    marginTop: 28,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonDisabled: { opacity: 0.4 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalDone: { marginTop: 8, backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalDoneText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
