// Birthday celebration (kid-facing): shown once, the first time the app is
// opened on the child's birthday. The day itself is also excused (see
// src/utils/excuse.ts) and a "9th Birthday"-style badge is awarded.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { playSound } from '../../services/sound';
import { Confetti } from '../../components/Confetti';
import { ordinal } from '../../utils/excuse';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'BirthdayCelebration'>;

export function BirthdayCelebrationScreen({ navigation }: Props) {
  const { childProfile, soundEnabled, completeBirthdayCelebration } = useAppData();
  const [result, setResult] = useState<{ age: number } | null>(null);
  const done = useRef(false);
  const cakeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    setResult(completeBirthdayCelebration());
    Animated.spring(cakeScale, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playSound('fanfare', soundEnabled);
    // Once, on the moment this screen first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = childProfile?.name?.trim().split(/\s+/)[0] ?? 'you';
  const age = result?.age;

  return (
    <View style={styles.screen}>
      <Confetti trigger={1} pieceCount={28} />
      <Animated.Text style={[styles.cake, { transform: [{ scale: cakeScale }] }]}>🎂</Animated.Text>
      <Text style={styles.title}>{age ? `Happy ${ordinal(age)} birthday, ${name}!` : `Happy birthday, ${name}!`}</Text>
      <Text style={styles.subtitle}>
        It's your day. Some Expected activities are optional today, and gigs are open if you want one.
      </Text>
      {age ? (
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>🏅 You earned the {ordinal(age)} Birthday badge</Text>
        </View>
      ) : null}
      <Pressable style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Let's go</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 28 },
  cake: { fontSize: 84, marginBottom: 18 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 10, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  badgePill: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  badgePillText: { fontSize: 13, fontWeight: '700', color: colors.text },
  button: { marginTop: 32, backgroundColor: colors.text, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 44 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
