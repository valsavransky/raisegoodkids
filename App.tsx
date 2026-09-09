import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SetupProvider } from './src/context/SetupContext';
import { AppDataProvider, useAppData } from './src/context/AppDataContext';
import { SetupNavigator } from './src/navigation/SetupNavigator';
import { RootStackNavigator } from './src/navigation/RootStackNavigator';
import { LoadingScreen } from './src/screens/LoadingScreen';

function RootNavigator() {
  const { childProfile, isHydrated } = useAppData();
  if (!isHydrated) return <LoadingScreen />;
  return childProfile ? <RootStackNavigator /> : <SetupNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <SetupProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SetupProvider>
      </AppDataProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
