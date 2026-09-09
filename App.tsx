import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SetupProvider } from './src/context/SetupContext';
import { AppDataProvider, useAppData } from './src/context/AppDataContext';
import { SetupNavigator } from './src/navigation/SetupNavigator';
import { RootStackNavigator } from './src/navigation/RootStackNavigator';

function RootNavigator() {
  const { childProfile } = useAppData();
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
