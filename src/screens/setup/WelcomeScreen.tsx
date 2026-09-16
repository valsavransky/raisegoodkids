// The very first thing a brand-new parent sees — before any setup starts,
// so nothing here can be personalized with the child's name yet (that's
// step 1, right after this). Explains what Merit actually is and why the
// Expected/Gigs split exists, since nothing else in the flow did before
// this screen existed (see the "Splash/start screen needs real content"
// item in docs/screens-and-flows.md's Known follow-ups).
//
// Two slides (trimmed down from an earlier four-slide, denser-copy cut per
// real user feedback: too many words, too many taps for a first launch) —
// one idea per slide, tapped through rather than shown as one dense block.
// No swipe library — a plain "Next" button drives local state, with a
// slide+fade so advancing reads as a real transition rather than a jump cut.
//
// "Delightful flair" here is deliberately lightweight rather than video or
// licensed imagery (real app-size and asset-sourcing cost for a screen seen
// once): a continuous, subtle idle animation on the logo so the screen
// doesn't sit dead-still, a small emoji accent per slide that pops in after
// the text (matching the emoji-as-icon language already used elsewhere in
// the app — Goal tab's 🎯, Future Fund's 📈), and a tactile press-scale on
// the button.
//
// The logo sits in its own fixed block above the slide text rather than
// being vertically centered together with it — centering them as one unit
// meant the logo's on-screen position shifted with every slide's text
// length. Only the text area re-centers itself as the copy changes.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SetupStackParamList } from '../../navigation/types';
import { Logo } from '../../components/Logo';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<SetupStackParamList, 'Welcome'>;

interface Slide {
  icon: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: '🌱',
    body: 'Raise a kid who gets it — that real work earns real reward, not a lecture about money.',
  },
  {
    icon: '🎯',
    body: "Chores are simply expected. Extra work is a gig that earns progress toward a goal they pick — teaching them to save first, then spend what they've actually earned.",
  },
];

const SLIDE_DISTANCE = 24;

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [slideIndex, setSlideIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const shift = useRef(new Animated.Value(0)).current;
  const iconPop = useRef(new Animated.Value(0)).current;
  const logoBreathe = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const isLastSlide = slideIndex === SLIDES.length - 1;
  const slide = SLIDES[slideIndex];

  // Continuous, subtle idle motion so the screen isn't dead-still while a
  // parent reads — low amplitude on purpose, this should read as "alive," not
  // distract from the copy.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoBreathe, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoBreathe, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [logoBreathe]);

  useEffect(() => {
    iconPop.setValue(0);
    Animated.spring(iconPop, { toValue: 1, delay: 120, friction: 5, useNativeDriver: true }).start();
    // Only replay the pop when the slide actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIndex]);

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

  const pressIn = () => Animated.spring(buttonScale, { toValue: 0.96, friction: 6, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(buttonScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const logoScale = logoBreathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 32, paddingBottom: 24 + insets.bottom }]}>
      <View style={styles.brandRow}>
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Logo size={64} />
        </Animated.View>
        <Text style={styles.wordmark}>Merit</Text>
      </View>

      <View style={styles.textArea}>
        <Animated.View style={[styles.slideContent, { opacity: fade, transform: [{ translateX: shift }] }]}>
          <Animated.Text style={[styles.icon, { opacity: iconPop, transform: [{ scale: iconPop }] }]}>
            {slide.icon}
          </Animated.Text>
          <Text style={styles.body}>{slide.body}</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
          ))}
        </View>
        <Pressable onPress={advance} onPressIn={pressIn} onPressOut={pressOut}>
          <Animated.View style={[styles.button, { transform: [{ scale: buttonScale }] }]}>
            <Text style={styles.buttonText}>{isLastSlide ? 'Get started' : 'Next'}</Text>
          </Animated.View>
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
  slideContent: { alignItems: 'center' },
  icon: { fontSize: 44, marginBottom: 18 },
  body: { fontSize: 19, color: colors.text, lineHeight: 27, textAlign: 'center' },
  footer: { paddingTop: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.expected, width: 22 },
  button: { backgroundColor: colors.expected, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
