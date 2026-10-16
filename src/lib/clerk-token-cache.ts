import type { TokenCache } from '@clerk/clerk-expo';

import { deleteSecret, getSecret, setSecret } from '@/lib/secure-store';

/**
 * Clerk session cache backed by the OS hardware keychain (expo-secure-store).
 *
 * This replaces the legacy web cookie/localStorage persistence and never stores
 * tokens in plain AsyncStorage. Every entry inherits the hardened
 * `WHEN_UNLOCKED_THIS_DEVICE_ONLY` accessibility from `@/lib/secure-store`, so
 * JWTs are never backed up or synced off-device.
 */
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await getSecret(key);
    } catch {
      // A corrupt/undecryptable entry (e.g. restored from another device) must
      // not wedge the session: evict it so Clerk can re-issue a fresh token.
      await deleteSecret(key).catch(() => {});
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    await setSecret(key, value);
  },
  async clearToken(key: string) {
    await deleteSecret(key);
  },
};
