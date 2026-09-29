// Setup's last step, and an optional one: pick a percentage of every gig to
// set aside automatically as a Future Fund, or leave it Off and turn it on
// later from Settings → Future Fund. Same picker as that Settings screen.
// This is where setup actually completes (completeSetup) — Gigs used to be
// the last screen.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { FuturePercentagePicker } from '../../components/FuturePercentagePicker';
import { useSetup } from '../../context/SetupContext';
import { useAppData } from '../../context/AppDataContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'FutureFundSetup'>;

export function FutureFundSetupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setup = useSetup();
  const { completeSetup } = useAppData();
  const [draft, setDraft] = useState(String(setup.futureFundPercentage));
  const [invalid, setInvalid] = useState(false);

  const finish = () => {
    const parsed = draft === '' ? 0 : parseFloat(draft);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setInvalid(true);
      return;
    }
    setup.setFutureFundPercentage(parsed);
    completeSetup({
      childProfile: setup.childProfile,
      scheduleEvents: setup.scheduleEvents,
      expectedItems: setup.expectedItems,
      gigs: setup.gigs,
      futureFundPercentage: parsed,
    });
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Future Fund (Optional)"
        step={5}
        totalSteps={5}
        onBack={() => navigation.goBack()}
        childName={setup.childProfile.name}
        childAvatarId={setup.childProfile.avatarId}
        onPressProfile={() => navigation.navigate('ChildProfile')}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.introText}>
          Teach your child early on about the importance of saving and investing for their future. Select a
          percentage of every gig earned to automatically go towards a Future Fund.
        </Text>
        <Text style={styles.helperText}>
          Not ready for this yet? No problem! Go to Settings &gt; Future Fund to turn this setting on when you are.
        </Text>

        <FuturePercentagePicker
          draft={draft}
          onChangeDraft={(text) => {
            setDraft(text);
            setInvalid(false);
          }}
        />
        {invalid && <Text style={styles.errorText}>Enter a percentage between 0 and 100.</Text>}
      </ScrollView>

      <Pressable style={[styles.finishButton, { marginBottom: 20 + insets.bottom }]} onPress={finish}>
        <Text style={styles.finishButtonText}>Finish setup</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 12 },
  introText: { fontSize: 14, color: colors.text, marginBottom: 12, lineHeight: 20 },
  helperText: { fontSize: 13, color: colors.textMuted, marginBottom: 20, lineHeight: 19 },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  finishButton: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
