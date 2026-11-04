import { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SetupProvider } from './src/context/SetupContext';
import { AuthProvider, NoAccountProvider } from './src/context/AuthContext';
import { AppDataProvider, useAppData } from './src/context/AppDataContext';
import { ApprovalsProvider } from './src/context/ApprovalsContext';
import { DeviceProvider, useDevice } from './src/context/DeviceContext';
import { SetupNavigator } from './src/navigation/SetupNavigator';
import { RootStackNavigator } from './src/navigation/RootStackNavigator';
import { ChildDeviceNavigator } from './src/navigation/ChildDeviceNavigator';
import { useDailyReminderSync } from './src/hooks/useDailyReminderSync';
import { useAnalytics } from './src/hooks/useAnalytics';
import { usePushRegistration, useNotificationTaps } from './src/hooks/usePushRegistration';
import { configureNotificationHandler } from './src/services/dailyReminder';
import { SheetProvider, useSheet } from './src/components/SheetProvider';
import { LoadingScreen } from './src/screens/LoadingScreen';

configureNotificationHandler();

const navigationRef = createNavigationContainerRef<Record<string, object | undefined>>();

function RootNavigator() {
  const { childProfile, isHydrated } = useAppData();
  useDailyReminderSync();
  useAnalytics();
  usePushRegistration();
  // Tapping a notification opens the screen it is about (once the app is ready).
  useNotificationTaps((screen) => {
    const tryOpen = (attempts: number) => {
      if (navigationRef.isReady() && childProfile) navigationRef.navigate(screen);
      else if (attempts > 0) setTimeout(() => tryOpen(attempts - 1), 500);
    };
    tryOpen(10);
  });
  if (!isHydrated) return <LoadingScreen />;
  return childProfile ? <RootStackNavigator /> : <SetupNavigator />;
}

/** The parent's phone: their own account, setup, approvals. */
function ParentApp() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <ApprovalsProvider>
          <SetupProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
          </SetupProvider>
        </ApprovalsProvider>
      </AppDataProvider>
    </AuthProvider>
  );
}

/** A family device: a child's view of the parent's account. No account of its own, no settings. */
function ChildApp({ token }: { token: string }) {
  const { unpair } = useDevice();
  const sheet = useSheet();
  const link = useMemo(
    () => ({
      token,
      onRemoved: () => {
        unpair(true);
        sheet.show({
          emoji: '🔌',
          emojiBg: '#F1F2F5',
          title: 'This device was unplugged',
          body: 'A parent took it off the family list. Ask them for a new code to hop back in.',
          actions: [{ label: 'Enter a new code' }],
        });
      },
    }),
    [token]
  );
  return (
    <NoAccountProvider>
      <AppDataProvider childDevice={link}>
        <NavigationContainer>
          <ChildDeviceNavigator />
        </NavigationContainer>
      </AppDataProvider>
    </NoAccountProvider>
  );
}

function Shell() {
  const { isReady, deviceToken } = useDevice();
  if (!isReady) return <LoadingScreen />;
  return deviceToken ? <ChildApp key={deviceToken} token={deviceToken} /> : <ParentApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SheetProvider>
        <DeviceProvider>
          <Shell />
        </DeviceProvider>
      </SheetProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
