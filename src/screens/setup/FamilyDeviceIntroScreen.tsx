// Setup's last step, and an optional one: explain family devices (kids tapping
// things done on a tablet or old phone, with a parent approving) and offer to set
// one up. Either button finishes setup (completeSetup); "Set up" also opens Family
// devices once the app is ready.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup } from '../../context/SetupContext';
import { useAppData } from '../../context/AppDataContext';
import { useTrackSetupStep } from '../../hooks/useTrackScreen';
import { dismissFamilyCard, requestOpenFamilyDevicesAfterSetup } from '../../utils/familyIntro';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'FamilyDeviceIntro'>;

export function FamilyDeviceIntroScreen({ navigation }: Props) {
  useTrackSetupStep('family_device');
  const insets = useSafeAreaInsets();
  const setup = useSetup();
  const { completeSetup } = useAppData();

  const finish = async (setUpNow: boolean) => {
    // Either way the Today card isn't needed: they've seen this.
    await dismissFamilyCard();
    if (setUpNow) await requestOpenFamilyDevicesAfterSetup();
    completeSetup({
      childProfile: setup.childProfile,
      scheduleEvents: setup.scheduleEvents,
      expectedItems: setup.expectedItems,
      gigs: setup.gigs,
      futureFundPercentage: setup.futureFundPercentage,
    });
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Let the kids tap for themselves?"
        step={6}
        totalSteps={6}
        onBack={() => navigation.goBack()}
        childName={setup.childProfile.name}
        childAvatarId={setup.childProfile.avatarId}
        onPressProfile={() => navigation.navigate('ChildProfile')}
      />

      <View style={styles.content}>
        <Text style={styles.intro}>
          On a family tablet or an old phone, your kids can see their trail and tap things done. You approve
          everything from your phone.
        </Text>
        <View style={styles.points}>
          <Text style={styles.point}>✓  Your kids never see Settings or money</Text>
          <Text style={styles.point}>✓  Nothing counts until you say yes</Text>
          <Text style={styles.point}>✓  Takes about a minute</Text>
        </View>
      </View>

      <Pressable style={styles.primary} onPress={() => finish(true)}>
        <Text style={styles.primaryText}>Set up a family device</Text>
      </Pressable>
      <Pressable style={[styles.skip, { marginBottom: 20 + insets.bottom }]} onPress={() => finish(false)} hitSlop={10}>
        <Text style={styles.skipText}>Skip for now. You can do this any time in Settings.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20 },
  intro: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 18 },
  points: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 10 },
  point: { fontSize: 14.5, color: colors.text, lineHeight: 20 },
  primary: { marginHorizontal: 20, backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { marginTop: 14, alignItems: 'center', paddingHorizontal: 20 },
  skipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
