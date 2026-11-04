// One friendly sheet that replaces the plain system pop-ups in the approval flow:
// an icon, a title, a line of explanation, optional detail rows, and clear buttons.
// Anything can open one with useSheet().show({...}).
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export interface SheetRow {
  icon?: string;
  title: string;
  small?: string;
  /** Right-hand label, e.g. "Approved". */
  tag?: string;
  tagTone?: 'good' | 'bad' | 'amber';
  /** A dashed ring in front of the row means "waiting for a parent". */
  waiting?: 'teal' | 'amber';
  status?: 'ok' | 'bad';
  dashedBorder?: boolean;
}

export interface SheetAction {
  label: string;
  kind?: 'primary' | 'amber' | 'danger' | 'ghost' | 'link';
  onPress?: () => void;
}

export interface SheetConfig {
  emoji?: string;
  /** Background of the round icon. */
  emojiBg?: string;
  title: string;
  body?: string;
  rows?: SheetRow[];
  /** Shown before the title: a row for the thing the sheet is about. */
  subject?: SheetRow;
  actions: SheetAction[];
}

interface SheetContextValue {
  show: (config: SheetConfig) => void;
  hide: () => void;
}

const SheetContext = createContext<SheetContextValue | undefined>(undefined);

export function SheetProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<SheetConfig | null>(null);
  const show = useCallback((c: SheetConfig) => setConfig(c), []);
  const hide = useCallback(() => setConfig(null), []);

  const renderRow = (row: SheetRow, key: string | number) => (
    <View key={key} style={[styles.row, row.dashedBorder && styles.rowDashed]}>
      {row.waiting ? (
        <View style={[styles.ring, { borderColor: row.waiting === 'amber' ? colors.gigs : colors.expected }]} />
      ) : row.status === 'ok' ? (
        <View style={styles.okDot}><Text style={styles.okMark}>✓</Text></View>
      ) : row.status === 'bad' ? (
        <View style={styles.badDot}><Text style={styles.badMark}>!</Text></View>
      ) : row.icon ? (
        <Text style={styles.rowIcon}>{row.icon}</Text>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        {row.small ? <Text style={styles.rowSmall}>{row.small}</Text> : null}
      </View>
      {row.tag ? (
        <Text
          style={[
            styles.rowTag,
            row.tagTone === 'good' && { color: '#0B6D63' },
            row.tagTone === 'bad' && { color: colors.danger },
            row.tagTone === 'amber' && { color: colors.gigs },
          ]}
        >
          {row.tag}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SheetContext.Provider value={{ show, hide }}>
      {children}
      <Modal visible={config !== null} transparent animationType="fade" onRequestClose={hide}>
        <Pressable style={styles.backdrop} onPress={hide}>
          <Pressable style={[styles.sheet, { marginBottom: 16 + insets.bottom }]} onPress={() => {}}>
            {config?.subject && !config.emoji ? renderRow(config.subject, 'subject') : null}
            {config?.emoji ? (
              <View style={[styles.iconCircle, { backgroundColor: config.emojiBg ?? '#E4F4F1' }]}>
                <Text style={styles.iconEmoji}>{config.emoji}</Text>
              </View>
            ) : null}
            <View style={styles.textGroup}>
              <Text style={styles.title}>{config?.title}</Text>
              {config?.body ? <Text style={styles.body}>{config.body}</Text> : null}
            </View>
            {config?.subject && config.emoji ? renderRow(config.subject, 'subject2') : null}
            {config?.rows && config.rows.length > 0 ? (
              <View style={styles.rowsGroup}>{config.rows.map((r, i) => renderRow(r, i))}</View>
            ) : null}
            <View style={styles.actionsGroup}>
              {config?.actions.map((a, i) => (
                <Pressable
                  key={i}
                  style={[
                    styles.button,
                    a.kind === 'amber' && { backgroundColor: colors.gigs },
                    a.kind === 'danger' && { backgroundColor: colors.danger },
                    a.kind === 'ghost' && styles.buttonGhost,
                    a.kind === 'link' && styles.buttonLink,
                  ]}
                  onPress={() => {
                    hide();
                    a.onPress?.();
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      (a.kind === 'ghost' || a.kind === 'link') && { color: a.kind === 'link' ? colors.textMuted : '#4B4F58' },
                    ]}
                  >
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SheetContext.Provider>
  );
}

export function useSheet(): SheetContextValue {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('useSheet must be used within a SheetProvider');
  return ctx;
}

/** The ordinary "something went wrong, try again" sheet. */
export function offlineSheet(title: string, body: string): SheetConfig {
  return { emoji: '📶', emojiBg: '#F1F2F5', title, body, actions: [{ label: 'OK' }] };
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', paddingHorizontal: 16 },
  // One even gap between every block, so no card ever touches the text next to it.
  sheet: { backgroundColor: '#fff', borderRadius: 24, padding: 22, gap: 16 },
  textGroup: { gap: 8 },
  rowsGroup: { gap: 10 },
  actionsGroup: { gap: 10, marginTop: 2 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  iconEmoji: { fontSize: 24 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EEE6D8',
    backgroundColor: '#FDF9F1',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  rowDashed: { borderStyle: 'dashed', borderColor: colors.gigs },
  rowIcon: { fontSize: 22 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowSmall: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
  rowTag: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  ring: { width: 26, height: 26, borderRadius: 13, borderWidth: 3, borderStyle: 'dashed' },
  okDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.expected, alignItems: 'center', justifyContent: 'center' },
  okMark: { color: '#fff', fontWeight: '800' },
  badDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FCE3E1', alignItems: 'center', justifyContent: 'center' },
  badMark: { color: colors.danger, fontWeight: '800' },
  button: { backgroundColor: colors.expected, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  buttonGhost: { backgroundColor: '#F3F1EC' },
  buttonLink: { backgroundColor: 'transparent', paddingVertical: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
