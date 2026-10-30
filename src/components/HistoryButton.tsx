import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { HistoryIcon } from './HistoryIcon';
import { track } from '../services/analytics';

/** Small icon button that opens History, shown on Today and in the This Week view. */
export function HistoryButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable
      onPress={() => {
        track('history_opened');
        navigation.navigate('History');
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="History"
      style={styles.button}
    >
      <HistoryIcon size={17} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#E4F4F1', alignItems: 'center', justifyContent: 'center' },
});
