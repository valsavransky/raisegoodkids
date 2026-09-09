// Placeholder end-of-wizard screen. The child home screen (build sequence
// step 3) doesn't exist yet, so this just confirms what was set up rather
// than navigating somewhere that isn't built.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { useSetup } from '../../context/SetupContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'SetupComplete'>;

export function SetupCompleteScreen({}: Props) {
  const { childProfile, expectedItems, gigs } = useSetup();
  const activeExpectedCount = expectedItems.filter((item) => item.active).length;
  const activeGigsCount = gigs.filter((gig) => gig.active).length;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{childProfile.name || 'Your child'} is set up</Text>
      <Text style={styles.summary}>
        {activeExpectedCount} Expected item{activeExpectedCount === 1 ? '' : 's'} and {activeGigsCount} gig
        {activeGigsCount === 1 ? '' : 's'} ready to go.
      </Text>
      <Text style={styles.note}>The daily check-in screen is next to build.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 12 },
  summary: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
