// Settings → Future Fund. The "pay yourself first" skim taken off every gig
// before the rest counts toward the active goal — previously a hardcoded
// 10% with nowhere a parent could see or change it; now off by default
// (DEFAULT_FUTURE_FUND_PERCENTAGE in AppDataContext) until a parent opts in. One field, so no sub-tabs like Gigs'
// list/values split.
//
// Preset chips (Off/5/10/15%, shared with setup's optional Future Fund step
// via FuturePercentagePicker) cover the common case in one tap; the free-form
// field underneath still takes anything 0-100. Saving shows a brief "✓ Saved" confirmation, then returns to
// Settings on its own (see useSaveConfirmation) — same as every other
// Settings save screen.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { FuturePercentagePicker } from '../../components/FuturePercentagePicker';
import { useAppData } from '../../context/AppDataContext';
import { useSaveConfirmation } from '../../hooks/useSaveConfirmation';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'FutureFundSettings'>;

export function FutureFundSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { futureFund, updateFutureFundPercentage } = useAppData();

  const [draft, setDraft] = useState(String(futureFund?.percentage ?? 0));
  const [invalid, setInvalid] = useState(false);
  const { saved, showSavedThenGoBack } = useSaveConfirmation(() => navigation.navigate('Settings'));

  const editDraft = (text: string) => {
    setDraft(text);
    setInvalid(false);
  };

  const save = () => {
    const parsed = parseFloat(draft);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setInvalid(true);
      return;
    }
    updateFutureFundPercentage(parsed);
    showSavedThenGoBack();
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Future Fund" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        <Text style={styles.helper}>
          The share of every gig that goes to the Future Fund first, before the rest counts toward their goal —
          shown to your child right on the Goal tab. Use the switch to turn it off.
        </Text>

        <FuturePercentagePicker draft={draft} onChangeDraft={editDraft} />

        <Pressable style={[styles.saveButton, saved && styles.saveButtonSaved]} onPress={save} disabled={saved}>
          <Text style={styles.saveButtonText}>{saved ? '✓ Saved' : 'Save'}</Text>
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
  saveButton: {
    marginTop: 16,
    backgroundColor: colors.futureFund,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonSaved: { backgroundColor: colors.success },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 10 },
});
