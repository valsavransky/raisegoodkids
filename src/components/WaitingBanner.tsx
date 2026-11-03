// "3 things waiting for you" on Today, with a Review button.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export function WaitingBanner({ count, onReview }: { count: number; onReview: () => void }) {
  return (
    <Pressable style={styles.banner} onPress={onReview} accessibilityRole="button">
      <Text style={styles.text}>
        {count === 1 ? '1 thing waiting for you' : `${count} things waiting for you`}
      </Text>
      <View style={styles.button}>
        <Text style={styles.buttonText}>Review</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#FCEBD2',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: { fontSize: 14, fontWeight: '800', color: '#7a4a06' },
  button: { backgroundColor: '#E8890C', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 14 },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
