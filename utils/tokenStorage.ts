import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Auth tokens live in the OS keychain/keystore, not in plain AsyncStorage.
 * expo-secure-store has no web implementation, so web falls back to
 * AsyncStorage (localStorage).
 */

const ACCESS_KEY = "auth.accessToken";
const REFRESH_KEY = "auth.refreshToken";

const isWeb = Platform.OS === "web";

async function getItem(key: string): Promise<string | null> {
  return isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string | null): Promise<void> {
  if (!value) {
    return isWeb ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
  }
  return isWeb ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
}

export async function loadTokens() {
  const [token, refreshToken] = await Promise.all([getItem(ACCESS_KEY), getItem(REFRESH_KEY)]);
  return { token, refreshToken };
}

export async function saveTokens(token: string | null, refreshToken: string | null) {
  try {
    await Promise.all([setItem(ACCESS_KEY, token), setItem(REFRESH_KEY, refreshToken)]);
  } catch (err) {
    console.warn("[tokenStorage] failed to save tokens:", err);
  }
}

export function clearTokens() {
  return saveTokens(null, null);
}
