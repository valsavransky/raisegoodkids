// Opened from the chip at the top right once there is more than one child:
// pick a child (or the Everyone overview), add a child, or open Settings.
import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../context/AppDataContext';
import { AvatarGlyph } from './AvatarGlyph';
import { EveryoneIcon } from './EveryoneIcon';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onEveryone: () => void;
  onAddChild: () => void;
  onSettings: () => void;
}

export function ChildSwitcherSheet({ visible, onClose, onEveryone, onAddChild, onSettings }: Props) {
  const insets = useSafeAreaInsets();
  const { childProfiles, childProfile, selectChild, viewingEveryone } = useAppData();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]} onPress={() => {}}>
          <Text style={styles.title}>Who's using Trekker?</Text>

          <Pressable style={styles.row} onPress={onEveryone}>
            <View style={[styles.circle, styles.everyoneCircle]}>
              <EveryoneIcon size={22} />
            </View>
            <Text style={styles.name}>Everyone</Text>
            {viewingEveryone && <Text style={styles.check}>✓</Text>}
          </Pressable>

          {childProfiles.map((child) => (
            <Pressable
              key={child.id}
              style={styles.row}
              onPress={() => {
                selectChild(child.id);
                onClose();
              }}
            >
              <AvatarGlyph avatarId={child.avatarId} size={38} />
              <Text style={styles.name} numberOfLines={1}>{child.name}</Text>
              {!viewingEveryone && child.id === childProfile?.id && <Text style={styles.check}>✓</Text>}
            </Pressable>
          ))}

          <Pressable style={styles.row} onPress={onAddChild}>
            <View style={[styles.circle, styles.addCircle]}>
              <Text style={styles.addIcon}>+</Text>
            </View>
            <Text style={[styles.name, styles.addLabel]}>Add child</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.row} onPress={onSettings}>
            <View style={[styles.circle, styles.settingsCircle]}>
              <Text style={styles.everyoneIcon}>⚙</Text>
            </View>
            <Text style={styles.name}>Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  circle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  everyoneCircle: { backgroundColor: '#E4F4F1' },
  settingsCircle: { backgroundColor: colors.surface },
  addCircle: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.textMuted },
  everyoneIcon: { fontSize: 18 },
  addIcon: { fontSize: 20, color: colors.textMuted, fontWeight: '700' },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  addLabel: { color: colors.expected },
  check: { fontSize: 18, fontWeight: '800', color: colors.expected },
  chevron: { fontSize: 20, color: colors.textMuted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
});
