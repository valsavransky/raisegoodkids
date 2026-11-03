import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** True for the first few weeks after a feature is first seen on this phone, to show a small NEW tag. */
export function useNewTag(key: string, days = 21): boolean {
  const [isNew, setIsNew] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const storageKey = `trekker.new.${key}`;
        const stored = await AsyncStorage.getItem(storageKey);
        if (!stored) {
          await AsyncStorage.setItem(storageKey, String(Date.now()));
          setIsNew(true);
          return;
        }
        setIsNew(Date.now() - Number(stored) < days * 24 * 60 * 60 * 1000);
      } catch {
        setIsNew(false);
      }
    })();
  }, [key, days]);
  return isNew;
}
