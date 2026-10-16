import AsyncStorage from '@react-native-async-storage/async-storage';

import { deleteSecret, getSecret, setSecret } from '@/lib/secure-store';

/**
 * Storage keys preserved from the legacy web app so sessions survive the
 * migration to native. Sensitive values (auth token) live in the OS keychain
 * via SecureStore (hardened, device-only accessibility); cosmetic/preference
 * values live in AsyncStorage.
 */
export const STORAGE_KEYS = {
  token: 'tattoogo_token',
  theme: 'tattoogo-theme',
  locale: 'tattoogo-locale',
  migrationFlag: 'tattoogo-migrated-v1',
} as const;

const SECURE_KEYS: ReadonlySet<string> = new Set([STORAGE_KEYS.token]);

async function readKey(key: string): Promise<string | null> {
  if (SECURE_KEYS.has(key)) {
    return getSecret(key);
  }
  return AsyncStorage.getItem(key);
}

async function writeKey(key: string, value: string): Promise<void> {
  if (SECURE_KEYS.has(key)) {
    await setSecret(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function deleteKey(key: string): Promise<void> {
  if (SECURE_KEYS.has(key)) {
    await deleteSecret(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

export const storage = {
  get: readKey,
  set: writeKey,
  remove: deleteKey,
};

/** Auth token helpers built on top of the hardened secure storage layer. */
export const authToken = {
  get: () => getSecret(STORAGE_KEYS.token),
  set: (token: string) => setSecret(STORAGE_KEYS.token, token),
  clear: () => deleteSecret(STORAGE_KEYS.token),
};

export type ThemePreference = 'light' | 'dark' | 'system';
export type LocalePreference = 'pt-BR' | 'en' | 'es';

export const preferences = {
  async getTheme(): Promise<ThemePreference | null> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.theme);
    return (value as ThemePreference | null) ?? null;
  },
  setTheme: (value: ThemePreference) => AsyncStorage.setItem(STORAGE_KEYS.theme, value),

  async getLocale(): Promise<LocalePreference | null> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.locale);
    return (value as LocalePreference | null) ?? null;
  },
  setLocale: (value: LocalePreference) => AsyncStorage.setItem(STORAGE_KEYS.locale, value),
};

/**
 * One-time migration of values captured from the legacy web build's
 * localStorage. The payload is injected externally (e.g. a deep link or a
 * first-launch bridge) because a native runtime has no `window.localStorage`.
 */
export interface LegacyWebStoragePayload {
  token?: string | null;
  theme?: ThemePreference | null;
  locale?: LocalePreference | null;
}

export async function migrateLegacyWebStorage(payload: LegacyWebStoragePayload): Promise<boolean> {
  const already = await AsyncStorage.getItem(STORAGE_KEYS.migrationFlag);
  if (already === 'true') return false;

  if (payload.token) await authToken.set(payload.token);
  if (payload.theme) await preferences.setTheme(payload.theme);
  if (payload.locale) await preferences.setLocale(payload.locale);

  await AsyncStorage.setItem(STORAGE_KEYS.migrationFlag, 'true');
  return true;
}
