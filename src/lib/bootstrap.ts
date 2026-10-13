import {
  migrateLegacyWebStorage,
  preferences,
  type LegacyWebStoragePayload,
  type LocalePreference,
  type ThemePreference,
} from './storage';

export interface BootstrapResult {
  theme: ThemePreference;
  locale: LocalePreference;
}

const DEFAULT_THEME: ThemePreference = 'dark';
const DEFAULT_LOCALE: LocalePreference = 'pt-BR';

export interface BootstrapOptions {
  /** Values captured from the legacy web build, if a bridge provided them. */
  legacy?: LegacyWebStoragePayload;
}

/**
 * Runs the minimal work required before the first frame of the real UI is
 * painted. Everything here is awaited by the native splash gate so the user
 * only ever sees one clean transition (no hydration flicker, no empty canvas).
 */
export async function bootstrapApp(options: BootstrapOptions = {}): Promise<BootstrapResult> {
  let theme: ThemePreference = DEFAULT_THEME;
  let locale: LocalePreference = DEFAULT_LOCALE;

  try {
    const [storedTheme, storedLocale] = await Promise.all([
      preferences.getTheme(),
      preferences.getLocale(),
    ]);
    if (storedTheme) theme = storedTheme;
    if (storedLocale) locale = storedLocale;

    if (options.legacy) {
      await migrateLegacyWebStorage(options.legacy);
    }
  } catch {
    // Boot must never dead-end on storage errors; fall back to defaults.
  }

  return { theme, locale };
}
