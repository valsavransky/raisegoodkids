// Anonymous usage events for the adoption dashboard on the server (see
// server/src/events.ts and admin.ts). What's recorded: a random install id
// this app makes for itself, event names, and a few coarse properties (a
// screen name, a grade, a percentage, a count). Never a name, email,
// birthday, or anything typed in — by design, and the server drops anything
// that isn't a short number/string/boolean.
//
// Offline-first like the rest of the app: events queue in AsyncStorage and
// go up in batches whenever there's a connection and a session token. Tracking
// can be turned off from Settings, which also drops anything still queued.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../config';
import { randomToken } from '../utils/randomToken';

const INSTALL_ID_KEY = 'merit.installId.v1';
const ENABLED_KEY = 'merit.analyticsEnabled.v1';
const QUEUE_KEY = 'merit.analyticsQueue.v1';
const MAX_QUEUE = 300;
const BATCH_SIZE = 100;
const FLUSH_DELAY_MS = 4000;

export type EventProps = Record<string, string | number | boolean>;

interface QueuedEvent {
  name: string;
  ts: string;
  props?: EventProps;
}

let installId = '';
let enabled = true;
let queue: QueuedEvent[] = [];
let authToken: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let readyPromise: Promise<void> | null = null;

async function load(): Promise<void> {
  try {
    const [storedId, storedEnabled, storedQueue] = await Promise.all([
      AsyncStorage.getItem(INSTALL_ID_KEY),
      AsyncStorage.getItem(ENABLED_KEY),
      AsyncStorage.getItem(QUEUE_KEY),
    ]);
    installId = storedId ?? randomToken(24);
    if (!storedId) await AsyncStorage.setItem(INSTALL_ID_KEY, installId);
    enabled = storedEnabled !== 'false';
    if (storedQueue) queue = JSON.parse(storedQueue) as QueuedEvent[];
  } catch (e) {
    console.warn('Analytics failed to load', e);
    if (!installId) installId = randomToken(24);
  }
}

function ready(): Promise<void> {
  if (!readyPromise) readyPromise = load();
  return readyPromise;
}

function persistQueue() {
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
}

function scheduleFlush() {
  if (flushTimer || !authToken) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_DELAY_MS);
}

async function flush(): Promise<void> {
  await ready();
  if (flushing || !enabled || !authToken || !API_BASE_URL || queue.length === 0) return;
  flushing = true;
  try {
    const batch = queue.slice(0, BATCH_SIZE);
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({
        installId,
        appVersion: Constants.expoConfig?.version ?? '',
        platform: Platform.OS,
        events: batch,
      }),
    });
    if (res.ok) {
      queue = queue.slice(batch.length);
      persistQueue();
      if (queue.length > 0) scheduleFlush();
    }
  } catch {
    // Offline or server down — the events stay queued for next time.
  } finally {
    flushing = false;
  }
}

/** Records an event. Safe to call anywhere; never throws or blocks. */
export function track(name: string, props?: EventProps): void {
  ready().then(() => {
    if (!enabled) return;
    queue.push({ name, ts: new Date().toISOString(), props });
    if (queue.length > MAX_QUEUE) queue = queue.slice(queue.length - MAX_QUEUE);
    persistQueue();
    scheduleFlush();
  });
}

/** Called by the app root with the current session token (null when none). */
export function setAnalyticsToken(token: string | null): void {
  authToken = token;
  if (token) {
    scheduleFlush();
  }
}

/** Send what's queued now (e.g. when the app goes to the background). */
export function flushAnalytics(): void {
  flush();
}

export async function isAnalyticsEnabled(): Promise<boolean> {
  await ready();
  return enabled;
}

export async function setAnalyticsEnabled(value: boolean): Promise<void> {
  await ready();
  enabled = value;
  await AsyncStorage.setItem(ENABLED_KEY, value ? 'true' : 'false');
  if (!value) {
    queue = [];
    persistQueue();
  }
}

// Push what's queued as the app leaves the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'background' || state === 'inactive') flush();
});
