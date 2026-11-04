// A small sheet for the note a parent adds when sending something back.
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialNote?: string;
  confirmLabel?: string;
  /** The item being sent back, shown at the top. */
  subject?: { title: string; small?: string };
  quickReplies?: string[];
  /** Who sees the note, for the preview line. */
  childName?: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

export function NoteSheet({ visible, title, subtitle, initialNote = '', confirmLabel = 'Done', subject, quickReplies, childName, onConfirm, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState(initialNote);
  useEffect(() => {
    if (visible) setNote(initialNote);
  }, [visible, initialNote]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onCancel}>
          <Pressable style={[styles.sheet, { paddingBottom: 18 + insets.bottom }]} onPress={() => {}}>
            {subject ? (
              <View style={styles.subject}>
                <View style={styles.subjectRing} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectTitle}>{subject.title}</Text>
                  {subject.small ? <Text style={styles.subjectSmall}>{subject.small}</Text> : null}
                </View>
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {quickReplies && quickReplies.length > 0 ? (
              <View style={styles.chips}>
                {quickReplies.map((q) => (
                  <Pressable key={q} onPress={() => setNote(q)} style={[styles.chip, note === q && styles.chipOn]}>
                    <Text style={[styles.chipText, note === q && { color: '#0B6D63' }]}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <TextInput
              style={styles.input}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={300}
            />
            {childName ? (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>{childName.toUpperCase()} WILL SEE</Text>
                <Text style={styles.previewText}>
                  Back on your list{subject ? `: ${subject.title}` : ''}
                  {note.trim() ? ` — “${note.trim()}”` : ''}
                </Text>
              </View>
            ) : null}
            <Pressable style={styles.confirm} onPress={() => onConfirm(note.trim())}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
            <Pressable style={styles.cancel} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  subject: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#EEE6D8', backgroundColor: '#FDF9F1', borderRadius: 14, padding: 12, marginBottom: 14 },
  subjectRing: { width: 26, height: 26, borderRadius: 13, borderWidth: 3, borderStyle: 'dashed', borderColor: colors.expected },
  subjectTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  subjectSmall: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { borderWidth: 1.5, borderColor: '#DDE3E8', borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 },
  chipOn: { backgroundColor: '#E4F4F1', borderColor: colors.expected },
  chipText: { fontSize: 13.5, fontWeight: '700', color: '#4B4F58' },
  preview: { backgroundColor: '#FCEBD2', borderRadius: 12, padding: 12, marginTop: 12 },
  previewLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.7, color: '#7A4A06' },
  previewText: { fontSize: 13.5, color: '#7A4A06', marginTop: 3, lineHeight: 19 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginTop: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  confirm: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancel: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
});
