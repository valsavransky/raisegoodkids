// Shown while AppDataContext hydrates from AsyncStorage on app start.
// Brief in practice, but real: without it there'd be a flash where a
// still-loading childProfile (null) looks identical to "no profile yet,"
// which would flicker the setup wizard open before snapping to Home.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Logo } from '../components/Logo';
import { colors } from '../theme/colors';

export function LoadingScreen() {
  return (
    <View style={styles.screen}>
      <Logo size={72} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});
