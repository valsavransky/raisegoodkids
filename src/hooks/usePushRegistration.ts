// Keeps this parent's phone registered for push notifications (once notifications are allowed), and opens the
// right screen when a notification is tapped.
import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { registerParentPush } from '../services/push';

export function usePushRegistration() {
  const { token } = useAuth();
  const { childProfile, isHydrated } = useAppData();
  const hasProfile = !!childProfile;
  useEffect(() => {
    if (!token || !isHydrated || !hasProfile) return;
    registerParentPush(token);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') registerParentPush(token);
    });
    return () => sub.remove();
  }, [token, isHydrated, hasProfile]);
}

/** A tapped notification can name a screen (e.g. Approvals); open it once navigation is ready. */
export function useNotificationTaps(navigate: (screen: string) => void) {
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const screen = response?.notification.request.content.data?.screen;
      if (typeof screen === 'string') navigate(screen);
    };
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
