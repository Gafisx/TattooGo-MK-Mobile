import { Platform } from 'react-native';

import { appIntegrityCloudProjectNumber, reportPublicEnv } from './env';
import { i18nStore } from './i18n/store';
import { offlineQueue } from './offline-queue';
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

/** Delay before touching Play Integrity / App Attest after the first frame. */
const ATTESTATION_WARMUP_DELAY_MS = 4000;

/**
 * Warms up the attestation provider *after* the UI is interactive.
 *
 * Play Integrity is an alpha native module that binds to Google Play services
 * and validates the Cloud project number. Running it inside the boot gate means
 * a slow/failed provider — or a build missing the native module — happens while
 * the JS runtime is still coming up, which on Android can surface as a hard
 * crash instead of a catchable JS error. Deferring it isolates any failure to
 * this best-effort task; `prepareHardwareAttestation` already swallows errors,
 * and the dynamic import protects bundle evaluation as an extra layer.
 */
function scheduleAttestationWarmUp(): void {
  if (Platform.OS === 'web') return;
  if (Platform.OS === 'android' && !appIntegrityCloudProjectNumber) return;

  const run = () => {
    void import('./security/hardware-attestation')
      .then(({ prepareHardwareAttestation }) => prepareHardwareAttestation())
      .catch((error) => {
        console.warn('[bootstrap] warm-up de atestação ignorado:', error);
      });
  };

  try {
    setTimeout(run, ATTESTATION_WARMUP_DELAY_MS);
  } catch {
    // Timer unavailable (very old runtime): skip the optional warm-up.
  }
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
    // Report (don't throw on) invalid public config before any network call.
    reportPublicEnv();

    const [storedTheme, storedLocale] = await Promise.all([
      preferences.getTheme(),
      preferences.getLocale(),
    ]);
    if (storedTheme) theme = storedTheme;
    if (storedLocale) locale = storedLocale;

    if (options.legacy) {
      await migrateLegacyWebStorage(options.legacy);
    }

    // Hydrate i18n *after* the legacy migration so a migrated locale wins.
    await i18nStore.hydrate();

    // Restore any likes queued while offline and start draining on reconnect.
    await offlineQueue.hydrate();

    // Never block the first frame on native attestation. Schedule it once the
    // UI is interactive; it is best-effort and must not be able to crash boot.
    scheduleAttestationWarmUp();
  } catch {
    // Boot must never dead-end on storage errors; fall back to defaults.
  }

  return { theme, locale };
}
