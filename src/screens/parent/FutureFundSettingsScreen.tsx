// Settings → Future Fund. The "pay yourself first" skim taken off every gig
// before the rest counts toward the active goal — previously a hardcoded
// 10% (DEFAULT_FUTURE_FUND_PERCENTAGE in AppDataContext) with nowhere a
// parent could see or change it. One field, so no sub-tabs like Gigs'
// list/values split — just the same save-with-validation pattern as Gigs'
// "Gig values" tab.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { SettingsSubHeader } from '../../components/SettingsSubHeader';
import { useAppData } from '../../context/AppDataContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'FutureFundSettings'>;
type Status = 'idle' | 'saved' | 'invalid';

export function FutureFundSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { futureFund, updateFutureFundPercentage } = useAppData();

  const [draft, setDraft] = useState(String(futureFund?.percentage ?? 10));
  const [status, setStatus] = useState<Status>('idle');

  const editDraft = (text: string) => {
    setDraft(text.replace(/[^0-9.]/g, ''));
    setStatus('idle');
  };

  const save = () => {
    const parsed = parseFloat(draft);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setStatus('invalid');
      return;
    }
    updateFutureFundPercentage(parsed);
    setStatus('saved');
  };

  return (
    <View style={styles.screen}>
      <SettingsSubHeader title="Future Fund" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        <Text style={styles.helper}>
          The share of every gig that goes to the Future Fund first, before the rest counts toward their goal —
          shown to your child right on the Goal tab.
        </Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Skim percentage</Text>
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

        <Pressable style={[styles.saveButton, status === 'saved' && styles.saveButtonSaved]} onPress={save}>
          <Text style={[styles.saveButtonText, status === 'saved' && styles.saveButtonTextSaved]}>
            {status === 'saved' ? '✓ Saved' : 'Save'}
          </Text>
        </Pressable>
        {status === 'invalid' && <Text style={styles.errorText}>Enter a percentage between 0 and 100.</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  helper: { fontSize: 12, color: colors.textMuted, marginBottom: 16, lineHeight: 17 },
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
    borderWidth: 1,
    borderColor: colors.futureFund,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonSaved: { borderColor: colors.success, backgroundColor: colors.success },
  saveButtonText: { color: colors.futureFund, fontSize: 14, fontWeight: '700' },
  saveButtonTextSaved: { color: '#fff' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 10 },
});
