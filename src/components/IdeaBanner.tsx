// "1 idea for Simi" on Today, with a Look button. Opens Approvals, where the idea lives.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export function IdeaBanner({ text, onLook }: { text: string; onLook: () => void }) {
  return (
    <Pressable style={styles.banner} onPress={onLook} accessibilityRole="button">
      <Text style={styles.text} numberOfLines={1}>
        💡 {text}
      </Text>
      <View style={styles.button}>
        <Text style={styles.buttonText}>Look</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#E4F4F1',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  text: { flex: 1, fontSize: 14, fontWeight: '800', color: '#0B6D63' },
  button: { backgroundColor: '#0F9B8E', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 14 },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
