// The very first thing a brand-new parent sees — before any setup starts,
// so nothing here can be personalized with the child's name yet (that's
// step 1, right after this). Explains what Merit actually is and why the
// Expected/Gigs split exists, since nothing else in the flow did before
// this screen existed (see the "Splash/start screen needs real content"
// item in docs/screens-and-flows.md's Known follow-ups).
//
// One idea per slide, tapped through rather than shown as one dense block —
// the first version put the whole pitch on screen at once and read as a
// wall of text on an actual phone. No swipe library — a plain "Next" button
// drives local state, with a slide+fade so advancing reads as a real
// transition rather than a jump cut.
//
// The logo sits in its own fixed block above the slide text rather than
// being vertically centered together with it — centering them as one unit
// meant the logo's on-screen position shifted with every slide's text
// length. Only the text area re-centers itself as the copy changes.
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { Logo } from '../../components/Logo';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'Welcome'>;

interface Slide {
  headline?: string;
  body?: string;
}

const SLIDES: Slide[] = [
  { headline: 'Raise a well-rounded, responsible kid who knows the value of hard work.' },
  {
    body: "In a world of instant gratification and one-tap purchases, it's easy to lose sight of what work is actually worth.",
  },
  {
    body: 'Being part of this family — school, chores, showing up — is simply expected, not a paid job. Anything extra is a gig: real work that earns real progress toward a goal they choose.',
  },
  {
    body: "Along the way, they'll learn to save first, watch their money grow, and spend what they've actually earned — never just a lecture about money.",
  },
];

const SLIDE_DISTANCE = 24;

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [slideIndex, setSlideIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const shift = useRef(new Animated.Value(0)).current;
  const isLastSlide = slideIndex === SLIDES.length - 1;
  const slide = SLIDES[slideIndex];

  const advance = () => {
    if (isLastSlide) {
      navigation.navigate('ChildProfile');
      return;
    }
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(shift, { toValue: -SLIDE_DISTANCE, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setSlideIndex((i) => i + 1);
      shift.setValue(SLIDE_DISTANCE);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(shift, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: 24 + insets.bottom }]}>
      <View style={styles.brandRow}>
        <Logo size={64} />
        <Text style={styles.wordmark}>Merit</Text>
      </View>

      <View style={styles.textArea}>
        <Animated.View style={[styles.slideContent, { opacity: fade, transform: [{ translateX: shift }] }]}>
          {slide.headline && <Text style={styles.headline}>{slide.headline}</Text>}
          {slide.body && <Text style={styles.body}>{slide.body}</Text>}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
          ))}
        </View>
        <Pressable style={styles.button} onPress={advance}>
          <Text style={styles.buttonText}>{isLastSlide ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  wordmark: { fontSize: 28, fontWeight: '700', color: colors.text },
  textArea: { flex: 1, justifyContent: 'center' },
  slideContent: {},
  headline: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 31,
  },
  body: { fontSize: 17, color: colors.textMuted, lineHeight: 25, textAlign: 'center' },
  footer: { paddingTop: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.expected, width: 22 },
  button: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
