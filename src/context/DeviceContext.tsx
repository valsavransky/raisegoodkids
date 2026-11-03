// Whether this phone/tablet is a family device (a child's view paired to a parent's account
// with a short code) instead of the parent's own phone. The device token lives in SecureStore;
// it can only send things for a parent to approve and read the family's data.
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_TOKEN_KEY = 'trekker_device_token';

interface DeviceContextValue {
  /** False until SecureStore has been read. */
  isReady: boolean;
  /** Set when this is a family device. */
  deviceToken: string | null;
  pairWith: (token: string) => Promise<void>;
  /** Forget the pairing (removed by a parent, or "use this phone as a parent's"). */
  unpair: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(DEVICE_TOKEN_KEY)
      .then((t) => setDeviceToken(t))
      .catch(() => {})
      .finally(() => setIsReady(true));
  }, []);

  const pairWith = async (token: string) => {
    await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, token);
    setDeviceToken(token);
  };
  const unpair = async () => {
    await SecureStore.deleteItemAsync(DEVICE_TOKEN_KEY).catch(() => {});
    await AsyncStorage.multiRemove([
      '@trekker/childDevice/data/v1',
      '@trekker/childDevice/child',
      '@trekker/childDevice/seen',
    ]).catch(() => {});
    setDeviceToken(null);
  };

  return (
    <DeviceContext.Provider value={{ isReady, deviceToken, pairWith, unpair }}>{children}</DeviceContext.Provider>
  );
}

export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDevice must be used within a DeviceProvider');
  return ctx;
}
