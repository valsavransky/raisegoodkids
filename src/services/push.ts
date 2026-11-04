// Push notifications on this phone: ask permission, get an Expo push token, and tell the server about it.
// The server decides what to send and when (see server/src/push.ts). This only works in a build that has
// push set up (a new native build); anywhere else it quietly does nothing and the local daily reminder
// carries on as before.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken, registerChildPushToken } from './api';
import { hasNotificationPermission, requestNotificationPermission } from './dailyReminder';

const ACTIVE_KEY = '@trekker/pushActive';
const CHILD_ASKED_KEY = '@trekker/childAskedForPush';

let ownToken: string | null = null;
/** This phone's own push token, once registered (used so the server doesn't push back to the sender). */
export function ownPushToken(): string | null {
  return ownToken;
}

/** True once this phone's token has reached the server: from then on the server sends the daily reminder. */
export async function isPushActive(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ACTIVE_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function setActive(active: boolean) {
  try {
    await AsyncStorage.setItem(ACTIVE_KEY, active ? 'true' : 'false');
  } catch {
    // Not worth failing over.
  }
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Trekker',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

async function fetchToken(): Promise<string | null> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;
    await ensureChannel();
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data ?? null;
  } catch (e) {
    // A build without push set up, an emulator, or no network.
    console.warn('[push] no push token', String(e));
    return null;
  }
}

const timeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
};

/** A parent's phone: register for push if notifications are allowed. Returns whether it worked. */
export async function registerParentPush(accountToken: string): Promise<boolean> {
  if (!(await hasNotificationPermission())) return false;
  const token = await fetchToken();
  if (!token) return false;
  try {
    await registerPushToken(accountToken, { token, platform: Platform.OS, tz: timeZone() });
    ownToken = token;
    await setActive(true);
    return true;
  } catch (e) {
    console.warn('[push] could not register', String(e));
    return false;
  }
}

/** A family device: ask once for permission (this is the child's own device), then register with the child using it. */
export async function registerChildPush(deviceToken: string, childId: string | null): Promise<boolean> {
  let allowed = await hasNotificationPermission();
  if (!allowed) {
    const asked = (await AsyncStorage.getItem(CHILD_ASKED_KEY).catch(() => null)) === 'true';
    if (asked) return false;
    await AsyncStorage.setItem(CHILD_ASKED_KEY, 'true').catch(() => {});
    allowed = (await requestNotificationPermission()) === 'granted';
  }
  if (!allowed) return false;
  const token = await fetchToken();
  if (!token) return false;
  try {
    await registerChildPushToken(deviceToken, { token, platform: Platform.OS, childId });
    return true;
  } catch (e) {
    console.warn('[push] child device could not register', String(e));
    return false;
  }
}
