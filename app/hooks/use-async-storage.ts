import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useAsyncStorage() {
  const [setItem, setSetItem] = useState<(key: string, value: string) => Promise<void>>(
    async (key: string, value: string) => {
      await AsyncStorage.setItem(key, value);
    }
  );
  const [getItem, setGetItem] = useState<(key: string) => Promise<string | null>>(
    async (key: string) => {
      return await AsyncStorage.getItem(key);
    }
  );

  return { setItem, getItem };
}