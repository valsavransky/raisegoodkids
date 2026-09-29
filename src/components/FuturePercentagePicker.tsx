// An on/off switch, and (only while on) preset chips (5 / 10 / 15%) plus a
// custom-percentage field — shared
// by setup's optional Future Fund step and Settings → Future Fund so the two
// stay identical. The parent owns the draft percentage string ("0" = off).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const PRESETS = [5, 10, 15];
const DEFAULT_WHEN_ON = '10';

interface Props {
  draft: string;
  onChangeDraft: (text: string) => void;
}

export function FuturePercentagePicker({ draft, onChangeDraft }: Props) {
  // Held locally so typing "0" in the custom field doesn't flip the switch
  // off mid-edit; starts on only if a percentage is already set.
  const [enabled, setEnabled] = useState(parseFloat(draft) > 0);
  const selectedPreset = PRESETS.find((p) => String(p) === draft);

  const toggle = (on: boolean) => {
    setEnabled(on);
    onChangeDraft(on ? (parseFloat(draft) > 0 ? draft : DEFAULT_WHEN_ON) : '0');
  };

  return (
    <View>
      <View style={styles.toggleRow}>
        <Text style={styles.rowLabel}>Turn on Future Fund</Text>
        <Switch
          value={enabled}
          onValueChange={toggle}
          trackColor={{ true: colors.futureFund }}
        />
      </View>

      {enabled && (
        <>
          <View style={styles.presetRow}>
            {PRESETS.map((preset) => {
              const selected = selectedPreset === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => onChangeDraft(String(preset))}
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
                onChangeText={(text) => onChangeDraft(text.replace(/[^0-9.]/g, ''))}
              />
              <Text style={styles.percentSign}>%</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
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
});
