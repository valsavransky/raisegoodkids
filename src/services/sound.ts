// Short, synthesized UI sound effects (no licensed audio — generated tones,
// see assets/sounds/). Each call creates a fresh AudioPlayer rather than
// reusing one instance, since these are short, infrequent, fire-and-forget
// clips (a chore checkoff) rather than anything needing gapless replay —
// simplicity here matters more than the small overhead of a new player.
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Let these sounds play even when an iPhone or iPad's silent switch is on (a kid's tablet often is).
let audioModeSet = false;
function ensureAudioMode() {
  if (audioModeSet) return;
  audioModeSet = true;
  setAudioModeAsync({ playsInSilentMode: true }).catch((e) => console.warn('[sound] audio mode failed', e));
}

const SOUNDS = {
  checkoff: require('../../assets/sounds/checkoff.wav'),
  gigComplete: require('../../assets/sounds/gigComplete.wav'),
  badgeUnlock: require('../../assets/sounds/badgeUnlock.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
} as const;

type SoundName = keyof typeof SOUNDS;

/** Plays a short sound effect, or does nothing when `enabled` is false —
 * callers pass the household's sound preference (see
 * AppDataContext.soundEnabled) rather than this module tracking its own
 * mutable state, so there's no risk of a stale toggle value. */
export function playSound(name: SoundName, enabled: boolean, debug?: (text: string) => void) {
  const say = (text: string) => {
    console.warn(`[sound] ${name}: ${text}`);
    debug?.(text);
  };
  if (!enabled) {
    say('sound is turned off in Settings');
    return;
  }
  ensureAudioMode();
  try {
    const player = createAudioPlayer(SOUNDS[name]);
    player.volume = 1;
    let started = false;
    const start = (why: string) => {
      if (started) return;
      started = true;
      try {
        player.play();
        say(`play() called (${why})`);
      } catch (e) {
        say(`play failed: ${String(e)}`);
      }
    };
    // Start as soon as the clip has loaded (starting before that can silently do nothing on Android),
    // and fall back to starting anyway shortly after.
    let sub: { remove: () => void } | null = null;
    try {
      sub = player.addListener('playbackStatusUpdate', (status: { isLoaded?: boolean; didJustFinish?: boolean }) => {
        if (status.isLoaded) start('loaded');
        if ((status as { playing?: boolean }).playing) say('playing');
        if (status.didJustFinish) {
          say('finished');
          sub?.remove();
          try {
            player.remove();
          } catch {
            // Already released.
          }
        }
      });
    } catch (e) {
      say(`could not listen for load: ${String(e)}`);
    }
    if (player.isLoaded) start('already loaded');
    setTimeout(() => start('fallback'), 250);
    // Release the player if the finish event never came.
    setTimeout(() => {
      try {
        sub?.remove();
        player.remove();
      } catch {
        // Already released.
      }
    }, 5000);
  } catch (e) {
    // A missing/broken sound file should never block the real action
    // (marking an item done) that triggered it.
    say(`could not play: ${String(e)}`);
  }
}
