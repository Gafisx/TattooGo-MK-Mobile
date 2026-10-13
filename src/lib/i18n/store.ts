import { getLocales } from 'expo-localization';

import { STORAGE_KEYS, storage } from '@/lib/storage';

import { DEFAULT_LOCALE, isLocale, normalizeLocale, type Locale } from './locales';

type Listener = () => void;

let currentLocale: Locale = DEFAULT_LOCALE;
let hydrated = false;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Minimal external store (no dependency) consumed via `useSyncExternalStore`.
 * Persists the selection to AsyncStorage under the legacy `tattoogo-locale`
 * key so locale survives restarts and matches the web contract.
 */
export const i18nStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getLocale(): Locale {
    return currentLocale;
  },

  setLocale(locale: Locale): void {
    if (locale === currentLocale) return;
    currentLocale = locale;
    emit();
    void storage.set(STORAGE_KEYS.locale, locale);
  },

  /** Loads a persisted locale, else derives one from the device. */
  async hydrate(): Promise<Locale> {
    if (hydrated) return currentLocale;
    hydrated = true;
    try {
      const stored = await storage.get(STORAGE_KEYS.locale);
      if (isLocale(stored)) {
        currentLocale = stored;
        emit();
        return currentLocale;
      }
      const device = getLocales()[0]?.languageTag;
      currentLocale = normalizeLocale(device);
      emit();
    } catch {
      // Never dead-end boot on storage/localization errors.
    }
    return currentLocale;
  },
};
