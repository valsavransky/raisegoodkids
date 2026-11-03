// One-time flags for introducing family devices to parents.
import AsyncStorage from '@react-native-async-storage/async-storage';

const CARD_DISMISSED_KEY = 'trekker.familyCardDismissed.v1';
const OPEN_AFTER_SETUP_KEY = 'trekker.openFamilyDevicesAfterSetup';

export async function isFamilyCardDismissed(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CARD_DISMISSED_KEY)) === '1';
  } catch {
    return true; // if storage is unavailable, don't nag
  }
}

export async function dismissFamilyCard(): Promise<void> {
  try {
    await AsyncStorage.setItem(CARD_DISMISSED_KEY, '1');
  } catch {
    // ignore
  }
}

/** Setup's family-device step: remember to open Family devices once the app is ready. */
export async function requestOpenFamilyDevicesAfterSetup(): Promise<void> {
  try {
    await AsyncStorage.setItem(OPEN_AFTER_SETUP_KEY, '1');
  } catch {
    // ignore
  }
}

/** True once, if setup asked for Family devices to open. */
export async function consumeOpenFamilyDevicesAfterSetup(): Promise<boolean> {
  try {
    const wanted = (await AsyncStorage.getItem(OPEN_AFTER_SETUP_KEY)) === '1';
    if (wanted) await AsyncStorage.removeItem(OPEN_AFTER_SETUP_KEY);
    return wanted;
  } catch {
    return false;
  }
}
