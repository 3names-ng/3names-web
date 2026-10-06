function key(prefix: string, keyName: string) {
  return `${prefix}:${keyName}`;
}

/** localStorage-backed SecureStore. Values are stored unencrypted (web has no enclave). */
export const SecureStore = {
  async getItemAsync(k: string, _options?: any): Promise<string | null> {
    try {
      return window.localStorage.getItem(key("secure", k));
    } catch {
      return null;
    }
  },

  async setItemAsync(k: string, value: string, _options?: any): Promise<void> {
    try {
      window.localStorage.setItem(key("secure", k), value);
    } catch {
      // storage full / disabled — ignore
    }
  },

  async deleteItemAsync(k: string, _options?: any): Promise<void> {
    try {
      window.localStorage.removeItem(key("secure", k));
    } catch {
      // ignore
    }
  },

  async canUseBiometricAuthentication(): Promise<boolean> {
    return false;
  },

  async isEnrolledAsync(): Promise<boolean> {
    return false;
  },

  async getEnrolledLevelAsync(): Promise<number> {
    return 0;
  },

  AFTER_FIRST_READ_ONLY: "AfterFirstReadOnly",
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WhenUnlockedThisDeviceOnly",
};

export default SecureStore;

// Namespace-style access (`import * as SecureStore from "expo-secure-store"`).
export const {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
  isEnrolledAsync,
  AFTER_FIRST_READ_ONLY,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} = SecureStore;
