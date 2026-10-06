import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * "Remember me" login credentials. Kept separate from the auth tokens so they
 * survive logout. Stored in the OS keychain/keystore; web has no secure
 * storage, so only the email is remembered there — never the password.
 */

const EMAIL_KEY = "auth.rememberedEmail";
const PASSWORD_KEY = "auth.rememberedPassword";

const isWeb = Platform.OS === "web";

export async function loadRememberedCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  try {
    if (isWeb) {
      const email = await AsyncStorage.getItem(EMAIL_KEY);
      return email ? { email, password: "" } : null;
    }
    const [email, password] = await Promise.all([
      SecureStore.getItemAsync(EMAIL_KEY),
      SecureStore.getItemAsync(PASSWORD_KEY),
    ]);
    return email ? { email, password: password ?? "" } : null;
  } catch (err) {
    console.warn("[credentialStorage] failed to load credentials:", err);
    return null;
  }
}

export async function saveRememberedCredentials(email: string, password: string) {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(EMAIL_KEY, email);
      return;
    }
    await Promise.all([
      SecureStore.setItemAsync(EMAIL_KEY, email),
      SecureStore.setItemAsync(PASSWORD_KEY, password),
    ]);
  } catch (err) {
    console.warn("[credentialStorage] failed to save credentials:", err);
  }
}

export async function clearRememberedCredentials() {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(EMAIL_KEY);
      return;
    }
    await Promise.all([
      SecureStore.deleteItemAsync(EMAIL_KEY),
      SecureStore.deleteItemAsync(PASSWORD_KEY),
    ]);
  } catch (err) {
    console.warn("[credentialStorage] failed to clear credentials:", err);
  }
}
