/**
 * Hardware-level app attestation.
 *
 * Produces a cryptographic, hardware-backed proof that a request comes from a
 * genuine installation of this app running on a genuine device, so the backend
 * can reject spoofed clients, modified builds and scripts.
 *
 *  - Android: Google Play Integrity API (standard request flow).
 *  - iOS: Apple App Attest (Secure Enclave key pair + assertions).
 *
 * The module is intentionally fail-open at the transport layer: it never throws
 * to callers. On a missing platform, a network hiccup, an unsupported device or
 * a provider expiry it logs the cause and resolves `null`, so a request is sent
 * without the header and the backend decides how to react (the API client only
 * attaches the header when a token is available).
 */

import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { appIntegrityCloudProjectNumber } from '@/lib/env';
import { deleteSecret, getSecret, setSecret } from '@/lib/secure-store';

const IS_ANDROID = Platform.OS === 'android';
const IS_IOS = Platform.OS === 'ios';

/** SecureStore key holding the App Attest key identifier (iOS only). */
const IOS_KEY_ID_STORAGE = 'hardware-attestation.ios.key-id';
/** SecureStore marker set once the iOS key has been attested by Apple. */
const IOS_ATTESTED_STORAGE = 'hardware-attestation.ios.attested';

/** Play Integrity standard requests require a base64url SHA-256 digest. */
const HASH_ENCODING = Crypto.CryptoEncoding.BASE64;

/** Error returned when the Android token provider has expired and must be rebuilt. */
const PROVIDER_INVALID_ERROR = 'ERR_APP_INTEGRITY_PROVIDER_INVALID';

/** Play Integrity expects the Google Cloud project number as a plain integer. */
const CLOUD_PROJECT_NUMBER_PATTERN = /^\d+$/;

type AppIntegrityModule = typeof import('@expo/app-integrity');

let androidProvider: Promise<void> | null = null;
let iosKeyId: string | null = null;
let appIntegrityModule: Promise<AppIntegrityModule | null> | null = null;

/**
 * Loads the native integrity module on demand.
 *
 * `@expo/app-integrity` calls `requireNativeModule('ExpoAppIntegrity')` while its
 * JS module is being evaluated. If a build was produced without the native
 * module (or with a mismatched binary), a static import throws during bundle
 * evaluation — before React (and therefore the app error boundary) can mount.
 * A dynamic import keeps that failure inside the attestation layer, which is
 * already designed to fail open.
 */
function loadAppIntegrity(): Promise<AppIntegrityModule | null> {
  if (!appIntegrityModule) {
    appIntegrityModule = import('@expo/app-integrity').catch((error) => {
      console.warn('[hardware-attestation] módulo nativo indisponível:', error);
      return null;
    });
  }
  return appIntegrityModule;
}

/** Requires the module and throws a controlled error when it is unavailable. */
async function requireAppIntegrity(): Promise<AppIntegrityModule> {
  const module = await loadAppIntegrity();
  if (!module) {
    throw new Error('módulo nativo @expo/app-integrity indisponível neste build');
  }
  return module;
}

/** Computes the base64 SHA-256 digest Play Integrity expects as `requestHash`. */
async function requestHash(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input, {
    encoding: HASH_ENCODING,
  });
}

/** Serializes an arbitrary request payload into a stable hash input. */
function hashInput(scope: string, payload: unknown): string {
  let serialized: string;
  try {
    serialized = payload === undefined ? '' : JSON.stringify(payload);
  } catch {
    // Circular / non-serializable payloads: fall back to the scope only.
    serialized = '';
  }
  return `${scope}:${serialized}`;
}

/**
 * Prepares (once) the Android integrity token provider for the configured cloud
 * project. Cached on success; reset on failure so the next call retries.
 */
async function ensureAndroidProvider(): Promise<void> {
  if (!appIntegrityCloudProjectNumber) {
    throw new Error('EXPO_PUBLIC_APP_INTEGRITY_CLOUD_PROJECT_NUMBER não configurado');
  }
  if (!CLOUD_PROJECT_NUMBER_PATTERN.test(appIntegrityCloudProjectNumber)) {
    throw new Error(
      'EXPO_PUBLIC_APP_INTEGRITY_CLOUD_PROJECT_NUMBER deve conter apenas dígitos',
    );
  }
  if (!androidProvider) {
    const AppIntegrity = await requireAppIntegrity();
    androidProvider = AppIntegrity.prepareIntegrityTokenProviderAsync(
      appIntegrityCloudProjectNumber,
    );
  }
  try {
    await androidProvider;
  } catch (error) {
    androidProvider = null;
    throw error;
  }
}

/** Requests a Play Integrity verdict token for the given hash. */
async function androidIntegrityToken(hash: string): Promise<string> {
  await ensureAndroidProvider();
  const AppIntegrity = await requireAppIntegrity();
  try {
    return await AppIntegrity.requestIntegrityCheckAsync(hash);
  } catch (error) {
    // An expired provider is the one error the SDK documents as retryable.
    if (error instanceof Error && error.message.includes(PROVIDER_INVALID_ERROR)) {
      androidProvider = null;
      await ensureAndroidProvider();
      return AppIntegrity.requestIntegrityCheckAsync(hash);
    }
    throw error;
  }
}

/** Reads the persisted App Attest key id, creating and storing one if absent. */
async function ensureIosKeyId(): Promise<string> {
  if (iosKeyId) return iosKeyId;

  const stored = await getSecret(IOS_KEY_ID_STORAGE);
  if (stored) {
    iosKeyId = stored;
    return stored;
  }

  const AppIntegrity = await requireAppIntegrity();
  const generated = await AppIntegrity.generateKeyAsync();
  await setSecret(IOS_KEY_ID_STORAGE, generated);
  iosKeyId = generated;
  return generated;
}

/**
 * Ensures the current install has an Apple-attested key, attesting it on first
 * use. The attestation step needs a server challenge; when one is not supplied
 * (e.g. a fire-and-forget header injection) the request hash is used, which
 * still binds the attestation to this specific request.
 */
async function ensureIosAttested(keyId: string, challenge: string): Promise<void> {
  const attested = await getSecret(IOS_ATTESTED_STORAGE);
  if (attested) return;

  const AppIntegrity = await requireAppIntegrity();
  await AppIntegrity.attestKeyAsync(keyId, challenge);
  await setSecret(IOS_ATTESTED_STORAGE, '1');
}

/** Produces an App Attest assertion signed by the Secure Enclave key. */
async function iosIntegrityToken(hash: string, challenge?: string): Promise<string> {
  const AppIntegrity = await requireAppIntegrity();
  if (!AppIntegrity.isSupported) {
    throw new Error('App Attest indisponível neste dispositivo');
  }
  const keyId = await ensureIosKeyId();
  await ensureIosAttested(keyId, challenge ?? hash);
  return AppIntegrity.generateAssertionAsync(keyId, challenge ?? hash);
}

export interface IntegrityTokenOptions {
  /**
   * Logical scope of the request (usually the endpoint path). Mixed into the
   * hash so distinct actions yield distinct verdicts.
   */
  scope?: string;
  /** Request payload bound to the verdict. */
  payload?: unknown;
  /**
   * A one-time challenge issued by the backend. Required for a strict App Attest
   * flow; when omitted the request hash is used instead.
   */
  challenge?: string;
}

/**
 * Requests a hardware attestation token for the current device.
 *
 * Resolves `null` (never throws) when attestation is unavailable or fails, so
 * callers can always proceed and let the backend apply its own policy.
 */
export async function getIntegrityToken(
  options: IntegrityTokenOptions = {},
): Promise<string | null> {
  if (!IS_ANDROID && !IS_IOS) return null;

  const hash = await requestHash(hashInput(options.scope ?? 'request', options.payload));

  try {
    if (IS_ANDROID) return await androidIntegrityToken(hash);
    return await iosIntegrityToken(hash, options.challenge);
  } catch (error) {
    console.warn('[hardware-attestation] falha ao obter token de integridade:', error);
    return null;
  }
}

/**
 * Warms up the attestation provider (Android) or the Secure Enclave key (iOS)
 * ahead of a critical request. Best-effort: errors are logged and swallowed.
 */
export async function prepareHardwareAttestation(): Promise<void> {
  try {
    if (IS_ANDROID) {
      await ensureAndroidProvider();
    } else if (IS_IOS) {
      const AppIntegrity = await requireAppIntegrity();
      if (AppIntegrity.isSupported) await ensureIosKeyId();
    }
  } catch (error) {
    console.warn('[hardware-attestation] preparação falhou:', error);
  }
}

/**
 * Drops cached / persisted attestation state. Call on sign-out so the next
 * session cannot reuse another account's key binding.
 */
export async function resetHardwareAttestation(): Promise<void> {
  androidProvider = null;
  iosKeyId = null;
  try {
    await deleteSecret(IOS_ATTESTED_STORAGE);
    await deleteSecret(IOS_KEY_ID_STORAGE);
  } catch {
    // Best-effort cleanup only.
  }
}
