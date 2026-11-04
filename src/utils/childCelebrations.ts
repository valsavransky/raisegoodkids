// Which celebrations (a goal reached, a badge earned) this family device has already shown to the
// child. A celebration only counts as seen once its screen is closed, so one that was interrupted
// (the app closed, the screen turned off) shows again the next time the app is open.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@trekker/childDevice/celebrated';
let seen: Set<string> | null = null;
const listeners = new Set<() => void>();

export async function loadCelebrated(): Promise<void> {
  if (seen) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    seen = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    seen = new Set();
  }
}

export function isCelebrated(id: string): boolean {
  return !!seen && seen.has(id);
}

export function markCelebrated(...ids: string[]): void {
  if (!seen) seen = new Set();
  ids.forEach((id) => seen!.add(id));
  AsyncStorage.setItem(KEY, JSON.stringify([...seen].slice(-400))).catch(() => {});
  listeners.forEach((fn) => fn());
}

/** Called whenever something is marked seen, so the next waiting celebration can show. */
export function onCelebrationsChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
