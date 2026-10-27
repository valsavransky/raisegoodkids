// The row of child chips used to switch whose day or settings you're looking at.
// "Everyone" (family overview) only appears where the screen can show it (Today).
import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppData } from '../context/AppDataContext';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

export function ChildChips({ showEveryone = false }: { showEveryone?: boolean }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { childProfiles, childProfile, selectChild, viewingEveryone, setViewingEveryone } = useAppData();
  const everyoneActive = showEveryone && viewingEveryone;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {showEveryone && (
        <Pressable
          onPress={() => setViewingEveryone(true)}
          style={[styles.chip, everyoneActive && styles.chipOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: everyoneActive }}
        >
          <Text style={[styles.text, everyoneActive && styles.textOn]}>Everyone</Text>
        </Pressable>
      )}
      {childProfiles.map((child) => {
        const on = !everyoneActive && child.id === childProfile?.id;
        return (
          <Pressable
            key={child.id}
            onPress={() => selectChild(child.id)}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.text, on && styles.textOn]} numberOfLines={1}>
              {child.name.trim().split(' ')[0]}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => navigation.navigate('AddChild')}
        style={[styles.chip, styles.addChip]}
        accessibilityLabel="Add a child"
      >
        <Text style={styles.addText}>+</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: colors.surface,
    maxWidth: 140,
  },
  chipOn: { backgroundColor: colors.expected },
  text: { fontSize: 14, fontWeight: '700', color: colors.text },
  textOn: { color: '#fff' },
  addChip: { backgroundColor: colors.background, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.textMuted },
  addText: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
});
