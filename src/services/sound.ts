// Short, synthesized UI sound effects (no licensed audio — generated tones,
// see assets/sounds/). Each call creates a fresh AudioPlayer rather than
// reusing one instance, since these are short, infrequent, fire-and-forget
// clips (a chore checkoff) rather than anything needing gapless replay —
// simplicity here matters more than the small overhead of a new player.
import { createAudioPlayer } from 'expo-audio';

const SOUNDS = {
  checkoff: require('../../assets/sounds/checkoff.wav'),
  gigComplete: require('../../assets/sounds/gigComplete.wav'),
} as const;

type SoundName = keyof typeof SOUNDS;

/** Plays a short sound effect, or does nothing when `enabled` is false —
 * callers pass the household's sound preference (see
 * AppDataContext.soundEnabled) rather than this module tracking its own
 * mutable state, so there's no risk of a stale toggle value. */
export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  try {
    const player = createAudioPlayer(SOUNDS[name]);
    player.volume = 0.7;
    player.play();
    // Release once the short clip has definitely finished — these are all
    // well under a second, so this is a generous margin, not a timer tied
    // to actual playback completion.
    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // Already released — nothing to do.
      }
    }, 3000);
  } catch {
    // A missing/broken sound file should never block the real action
    // (marking an item done) that triggered it.
  }
}
