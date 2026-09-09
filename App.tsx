import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SetupProvider } from './src/context/SetupContext';
import { SetupNavigator } from './src/navigation/SetupNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <SetupProvider>
        <NavigationContainer>
          <SetupNavigator />
        </NavigationContainer>
      </SetupProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
