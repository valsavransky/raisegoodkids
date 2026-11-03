// A family device asks once (and again from the top-right chip) who is using it.
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../../context/AppDataContext';
import { Logo } from '../../components/Logo';
import { AvatarGlyph } from '../../components/AvatarGlyph';
import { colors } from '../../theme/colors';

export function ChildPickerScreen() {
  const insets = useSafeAreaInsets();
  const { childProfiles, selectChild } = useAppData();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.brand}>
        <Logo size={44} />
        <Text style={styles.wordmark}>Trekker</Text>
      </View>
      <Text style={styles.title}>Who's using Trekker?</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {childProfiles.map((child) => (
          <Pressable key={child.id} style={styles.tile} onPress={() => selectChild(child.id)}>
            <AvatarGlyph avatarId={child.avatarId} size={72} />
            <Text style={styles.name} numberOfLines={1}>
              {child.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  wordmark: { fontSize: 26, fontWeight: '800', color: colors.text },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginVertical: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  tile: {
    width: 140,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 10,
  },
  name: { fontSize: 17, fontWeight: '700', color: colors.text, maxWidth: 120 },
});
