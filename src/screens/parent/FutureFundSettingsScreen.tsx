// Settings → Future Fund. The "pay yourself first" skim taken off every gig
// before the rest counts toward the active goal — previously a hardcoded
// 10% (DEFAULT_FUTURE_FUND_PERCENTAGE in AppDataContext) with nowhere a
// parent could see or change it. One field, so no sub-tabs like Gigs'
// list/values split.
//
// Preset chips (5/10/15%, the range real "pay yourself first" advice
// typically lands in) cover the common case in one tap; the free-form field
// underneath still takes anything 0-100 for a parent who wants a specific
// number. Saving jumps straight back to Settings rather than lingering on a
// "✓ Saved" button — same as every other Settings save screen.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAppData } from '../../context/AppDataContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'FutureFundSettings'>;

const PRESETS = [5, 10, 15];

export function FutureFundSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { futureFund, updateFutureFundPercentage } = useAppData();

  const [draft, setDraft] = useState(String(futureFund?.percentage ?? 10));
  const [invalid, setInvalid] = useState(false);

  const selectPreset = (value: number) => {
    setDraft(String(value));
    setInvalid(false);
  };

  const editDraft = (text: string) => {
    setDraft(text.replace(/[^0-9.]/g, ''));
    setInvalid(false);
  };

  const save = () => {
    const parsed = parseFloat(draft);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setInvalid(true);
      return;
    }
    updateFutureFundPercentage(parsed);
    navigation.navigate('Settings');
  };

  const selectedPreset = PRESETS.find((p) => String(p) === draft);

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Future Fund" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        <Text style={styles.helper}>
          The share of every gig that goes to the Future Fund first, before the rest counts toward their goal —
          shown to your child right on the Goal tab.
        </Text>

        <View style={styles.presetRow}>
          {PRESETS.map((preset) => {
            const selected = selectedPreset === preset;
            return (
              <Pressable
                key={preset}
                onPress={() => selectPreset(preset)}
                style={[styles.presetChip, selected && styles.presetChipSelected]}
              >
                <Text style={[styles.presetChipText, selected && styles.presetChipTextSelected]}>{preset}%</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Custom percentage</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={draft}
              onChangeText={editDraft}
            />
            <Text style={styles.percentSign}>%</Text>
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={save}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
        {invalid && <Text style={styles.errorText}>Enter a percentage between 0 and 100.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  helper: { fontSize: 12, color: colors.textMuted, marginBottom: 16, lineHeight: 17 },
  presetRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  presetChipSelected: { backgroundColor: colors.futureFund, borderColor: colors.futureFund },
  presetChipText: { fontSize: 16, fontWeight: '700', color: colors.text },
  presetChipTextSelected: { color: '#fff' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: colors.surface,
  },
  rowLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
  },
  input: { fontSize: 15, color: colors.text, paddingVertical: 8, width: 48, textAlign: 'right' },
  percentSign: { fontSize: 15, color: colors.textMuted, marginLeft: 2 },
  saveButton: {
    marginTop: 16,
    backgroundColor: colors.futureFund,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 10 },
});
