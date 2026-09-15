// Screen 7b: parent setup, step 4 of 4 — Gigs. Split out from what used to
// be a single combined Expected+Gigs screen (see ExpectedSetupScreen for
// why); this is also the wizard's final step, so it ends in "Finish setup"
// rather than "Continue."
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSetup, DraftGig, makeLocalId } from '../../context/SetupContext';
import { useAppData } from '../../context/AppDataContext';
import { getContentLibraryForGrade, SuggestedGig } from '../../data/contentLibrary';
import { GigEffortTier } from '../../types/models';
import { colors } from '../../theme/colors';

const EFFORT_TIERS: { value: GigEffortTier; label: string }[] = [
  { value: 'quick', label: 'Quick' },
  { value: 'medium', label: 'Medium' },
  { value: 'big_job', label: 'Big job' },
];

type Props = NativeStackScreenProps<SetupStackParamList, 'GigsSetup'>;

export function GigsSetupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setup = useSetup();
  const { childProfile, gigs, setGigs } = setup;
  const { completeSetup } = useAppData();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftEffortTier, setDraftEffortTier] = useState<GigEffortTier>('quick');

  useEffect(() => {
    // A yard/car gig only makes sense if the household actually has one —
    // see ChildProfileScreen's household questions and contentLibrary.ts's
    // ifApplicable field, which existed but went unused until now.
    const library = getContentLibraryForGrade(childProfile.grade);
    const householdAllows = (gig: SuggestedGig) => {
      if (gig.ifApplicable === 'yard') return !!childProfile.hasYard;
      if (gig.ifApplicable === 'car') return !!childProfile.hasCar;
      return true;
    };
    const existingNames = new Set(gigs.map((gig) => gig.name));
    const suggestions: SuggestedGig[] = [
      ...(library?.gigs.filter(householdAllows) ?? []),
      // Walking is the one pet-care task that's optional/paid rather than a
      // standing daily responsibility (feeding is the Expected item — see
      // ExpectedSetupScreen) — and only clearly applies to a dog.
      ...(childProfile.hasPet && childProfile.petType?.trim().toLowerCase().includes('dog')
        ? [{ name: `Walk ${childProfile.petName?.trim() || 'the dog'}`, effortTier: 'quick' as const }]
        : []),
    ];
    const newGigs = suggestions
      .filter((gig) => !existingNames.has(gig.name))
      .map((gig) => ({
        localId: makeLocalId('gig'),
        name: gig.name,
        effortTier: gig.effortTier,
        active: true,
      }));
    if (newGigs.length > 0) {
      setGigs([...gigs, ...newGigs]);
    }
    // Only run once, on mount, to seed suggestions — not on every keystroke elsewhere in context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const library = getContentLibraryForGrade(childProfile.grade);

  const toggleGig = (localId: string) => {
    setGigs(gigs.map((gig) => (gig.localId === localId ? { ...gig, active: !gig.active } : gig)));
  };

  const setGigEffortTier = (localId: string, effortTier: GigEffortTier) => {
    setGigs(gigs.map((gig) => (gig.localId === localId ? { ...gig, effortTier } : gig)));
  };

  const openAddModal = () => {
    setDraftName('');
    setDraftEffortTier('quick');
    setAddModalVisible(true);
  };

  const confirmAdd = () => {
    if (!draftName.trim()) return;
    const gig: DraftGig = {
      localId: makeLocalId('gig'),
      name: draftName.trim(),
      effortTier: draftEffortTier,
      active: true,
    };
    setGigs([...gigs, gig]);
    setAddModalVisible(false);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Gigs" step={4} totalSteps={4} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.introText}>
          Does {childProfile.name.trim() || 'your child'} always ask for the newest toy, clothes,
          or games — or to go somewhere extra fun? Gigs are optional, paid work they choose (or you
          add your own) that count toward whatever they're saving for.
        </Text>

        <Text style={styles.helperText}>
          {library
            ? `Suggestions below are typical for ${childProfile.grade} grade. Toggle off what doesn't apply, or add your own.`
            : "We don't have grade-specific suggestions yet — add items below."}
        </Text>

        {gigs.map((gig) => (
          <View key={gig.localId} style={styles.gigRow}>
            <Pressable style={styles.gigCheckboxRow} onPress={() => toggleGig(gig.localId)}>
              <View style={[styles.checkbox, gig.active && styles.checkboxChecked]}>
                {gig.active && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={[styles.itemName, !gig.active && styles.itemNameInactive]}>{gig.name}</Text>
            </Pressable>
            <View style={styles.effortRow}>
              {EFFORT_TIERS.map((tier) => {
                const selected = gig.effortTier === tier.value;
                return (
                  <Pressable
                    key={tier.value}
                    onPress={() => setGigEffortTier(gig.localId, tier.value)}
                    style={[styles.effortChip, selected && styles.effortChipSelected]}
                  >
                    <Text style={[styles.effortChipText, selected && styles.effortChipTextSelected]}>
                      {tier.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <Pressable style={styles.addLink} onPress={openAddModal}>
          <Text style={styles.addLinkText}>+ Add custom gig</Text>
        </Pressable>
      </ScrollView>

      <Pressable
        style={[styles.finishButton, { marginBottom: 20 + insets.bottom }]}
        onPress={() =>
          completeSetup({
            childProfile: setup.childProfile,
            scheduleEvents: setup.scheduleEvents,
            expectedItems: setup.expectedItems,
            gigs: setup.gigs,
          })
        }
      >
        <Text style={styles.finishButtonText}>Finish setup</Text>
      </Pressable>

      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAddModalVisible(false)}>
          <Pressable style={[styles.modalCard, { paddingBottom: 20 + insets.bottom }]} onPress={() => {}}>
            <Text style={styles.modalTitle}>Add gig</Text>
            <TextInput style={styles.input} placeholder="Name" value={draftName} onChangeText={setDraftName} />
            <View style={styles.effortRow}>
              {EFFORT_TIERS.map((tier) => {
                const selected = draftEffortTier === tier.value;
                return (
                  <Pressable
                    key={tier.value}
                    onPress={() => setDraftEffortTier(tier.value)}
                    style={[styles.effortChip, selected && styles.effortChipSelected]}
                  >
                    <Text style={[styles.effortChipText, selected && styles.effortChipTextSelected]}>
                      {tier.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalAddButton} onPress={confirmAdd}>
                <Text style={styles.modalAddText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 12 },
  introText: { fontSize: 14, color: colors.text, marginBottom: 14, lineHeight: 20 },
  helperText: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 19 },
  gigRow: { paddingVertical: 10, gap: 8 },
  gigCheckboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.expected, borderColor: colors.expected },
  checkboxMark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  itemName: { fontSize: 15, color: colors.text, flexShrink: 1 },
  itemNameInactive: { color: colors.textMuted, textDecorationLine: 'line-through' },
  effortRow: { flexDirection: 'row', gap: 6, marginLeft: 34 },
  effortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  effortChipSelected: { backgroundColor: colors.gigs, borderColor: colors.gigs },
  effortChipText: { fontSize: 12, color: colors.text },
  effortChipTextSelected: { color: '#fff', fontWeight: '600' },
  addLink: { paddingVertical: 10 },
  addLinkText: { color: colors.expected, fontSize: 14, fontWeight: '600' },
  finishButton: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalCancelButton: { paddingVertical: 12, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  modalAddButton: {
    backgroundColor: colors.expected,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalAddText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
