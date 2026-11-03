import { useMemo } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
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
import { configureNotificationHandler } from './src/services/dailyReminder';
import { LoadingScreen } from './src/screens/LoadingScreen';

configureNotificationHandler();

function RootNavigator() {
  const { childProfile, isHydrated } = useAppData();
  useDailyReminderSync();
  useAnalytics();
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
            <NavigationContainer>
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
  const link = useMemo(
    () => ({
      token,
      onRemoved: () => {
        unpair();
        Alert.alert('This device was removed', 'A parent removed it from Family devices. Set it up again with a new code.');
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
      <DeviceProvider>
        <Shell />
      </DeviceProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
