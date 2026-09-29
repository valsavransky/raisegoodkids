// App-level analytics wiring: hands the session token to the analytics
// service, and records an "app_opened" each time the app comes to the
// foreground (plus once at launch).
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { setAnalyticsToken, track } from '../services/analytics';

export function useAnalytics() {
  const { token } = useAuth();
  const { childProfile, isHydrated } = useAppData();
  const hasProfile = !!childProfile;

  useEffect(() => {
    setAnalyticsToken(token);
  }, [token]);

  useEffect(() => {
    if (!isHydrated) return;
    track('app_opened', { has_profile: hasProfile });
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') track('app_opened', { has_profile: hasProfile });
    });
    return () => sub.remove();
  }, [isHydrated, hasProfile]);
}
