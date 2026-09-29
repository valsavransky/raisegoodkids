import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SetupProvider } from './src/context/SetupContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppDataProvider, useAppData } from './src/context/AppDataContext';
import { SetupNavigator } from './src/navigation/SetupNavigator';
import { RootStackNavigator } from './src/navigation/RootStackNavigator';
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

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppDataProvider>
          <SetupProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </SetupProvider>
        </AppDataProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
