// Daily reminder for the parent: if nothing has been checked off by a chosen
// time (default 6:00 PM), the phone shows one local notification. Entirely
// on-device — no push tokens, no server — since the device already knows its
// own clock. Settings live in AsyncStorage (device-local, like the coachmark
// flags) and are cleared by "Reset all data".
//
// Notifications are one-shot DATE triggers rather than a repeating DAILY one,
// because whether a reminder is wanted depends on the day: syncDailyReminder
// throws away everything scheduled and re-lays the next few days each time
// the app comes to the foreground or something gets checked off, skipping
// today once anything is done. If the app isn't opened at all, the last
// scheduled reminder fires and then they stop (DAYS_AHEAD) — a longer absence
// is a different problem than a habit nudge.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const SETTINGS_KEY = 'merit.dailyReminder.v1';
const CHANNEL_ID = 'daily-reminder';
const ID_PREFIX = 'daily-reminder-';
const DAYS_AHEAD = 7;

export const DEFAULT_REMINDER_TIME = '18:00';

export interface ReminderSettings {
  enabled: boolean;
  /** 24-hour "HH:MM", same format as schedule events. */
  time: string;
}

export type PermissionResult = 'granted' | 'denied';

export function reminderBody(childName?: string): string {
  const who = childName?.trim().split(/\s+/)[0] || 'your child';
  return `Today's Expected activities haven't been started. Open Merit to check in with ${who}.`;
}

/** Foreground behavior: show the banner if the app happens to be open. */
export function configureNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('Notifications unavailable', e);
  }
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
      return { enabled: !!parsed.enabled, time: parsed.time ?? DEFAULT_REMINDER_TIME };
    }
  } catch (e) {
    console.warn('Failed to read reminder settings', e);
  }
  return { enabled: false, time: DEFAULT_REMINDER_TIME };
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Shows the phone's own permission prompt (only if it can still be shown). */
export async function requestNotificationPermission(): Promise<PermissionResult> {
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    if (!current.canAskAgain) return 'denied';
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted ? 'granted' : 'denied';
  } catch (e) {
    console.warn('Notification permission request failed', e);
    return 'denied';
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The next few moments a reminder should fire: today's chosen time if it's
 * still ahead and nothing's been done, then each following day's. */
export function upcomingReminderDates(now: Date, time: string, doneToday: boolean, days = DAYS_AHEAD): Date[] {
  const [h, m] = time.split(':').map(Number);
  const dates: Date[] = [];
  for (let i = 0; i < days; i++) {
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, Number.isFinite(h) ? h : 18, Number.isFinite(m) ? m : 0, 0, 0);
    if (target.getTime() <= now.getTime()) continue;
    if (i === 0 && doneToday) continue;
    dates.push(target);
  }
  return dates;
}

async function cancelOurNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/** Re-lays the reminders to match current settings and today's progress.
 * Safe to call as often as needed; never throws. */
export async function syncDailyReminder(state: { childName?: string; doneToday: boolean }): Promise<void> {
  try {
    await cancelOurNotifications();
    const settings = await loadReminderSettings();
    if (!settings.enabled || !(await hasNotificationPermission())) return;
    await ensureAndroidChannel();
    const body = reminderBody(state.childName);
    for (const date of upcomingReminderDates(new Date(), settings.time, state.doneToday)) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        content: { title: 'Merit', body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
      });
    }
  } catch (e) {
    console.warn('Failed to schedule daily reminder', e);
  }
}

/** Turns the reminder off and forgets its settings ("Reset all data"). */
export async function clearDailyReminder(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    await cancelOurNotifications();
  } catch (e) {
    console.warn('Failed to clear daily reminder', e);
  }
}
