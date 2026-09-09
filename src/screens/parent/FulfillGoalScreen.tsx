// Screen 13: parent — fulfill goal prompt. Marking a goal fulfilled is just
// a real-world record ("I actually delivered this") — it no longer gates
// the next queued goal, which activates automatically the moment this one
// is achieved (see AppDataContext.markGigDone). A parent shouldn't have to
// complete a real-world purchase or trip before their kid can keep earning
// toward the next thing. Parent-facing voice is calm and efficient — no
// exclamation points.
//
// "I'll do this later" leaves the goal in 'achieved' status rather than
// forcing fulfillment on the spot — a real trip or purchase often can't
// happen right at this moment. The Goal tab's "Finish up" action on an
// achieved goal (see GoalPickerScreen) is how a parent gets back here.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppData } from '../../context/AppDataContext';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'FulfillGoal'>;

function daysBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function FulfillGoalScreen({ route, navigation }: Props) {
  const { goalId } = route.params;
  const { getGoal, childProfile, markGoalFulfilled } = useAppData();
  const goal = getGoal(goalId);

  const daysTaken = goal?.achievedAt ? daysBetween(goal.createdAt, goal.achievedAt) : null;

  const handleFulfilled = () => {
    markGoalFulfilled(goalId);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.trophy}>🏆</Text>
      <Text style={styles.title}>
        {childProfile?.name ?? 'Your child'} reached "{goal?.name ?? 'their goal'}"
      </Text>
      {daysTaken !== null && (
        <Text style={styles.subtitle}>
          Reached in {daysTaken} day{daysTaken === 1 ? '' : 's'}
        </Text>
      )}
      <Text style={styles.instruction}>Mark it fulfilled once you've handled it in real life.</Text>
      <Pressable style={styles.fulfilledButton} onPress={handleFulfilled}>
        <Text style={styles.fulfilledButtonText}>Mark as fulfilled</Text>
      </Pressable>
      <Pressable
        style={styles.laterButton}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
      >
        <Text style={styles.laterButtonText}>I'll do this later</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  trophy: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
  instruction: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 24, lineHeight: 20 },
  fulfilledButton: {
    marginTop: 28,
    backgroundColor: colors.expected,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  fulfilledButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  laterButton: { marginTop: 16, paddingVertical: 10 },
  laterButtonText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
