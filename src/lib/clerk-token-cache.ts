import type { TokenCache } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

/**
 * Clerk session cache backed by the OS secure keychain. This replaces the
 * legacy web cookie/localStorage persistence and never stores tokens in plain
 * AsyncStorage.
 */
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};
