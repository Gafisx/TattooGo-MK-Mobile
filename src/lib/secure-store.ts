import * as SecureStore from 'expo-secure-store';

/**
 * Hardened persistence options for every secret written to the OS keychain.
 *
 * `WHEN_UNLOCKED_THIS_DEVICE_ONLY` binds the ciphertext to this device's
 * hardware keychain and to the unlocked state:
 *  - it is never synced to iCloud Keychain / Google backups, and
 *  - it is never readable while the device is locked.
 *
 * This is the strongest accessibility class available without forcing a
 * user-presence (biometric) prompt on every read, which would break background
 * token refreshes.
 */
export const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/** Reads a secret from the hardware-backed keychain. */
export function getSecret(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
}

/** Writes a secret to the hardware-backed keychain. */
export function setSecret(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
}

/** Removes a secret from the hardware-backed keychain. */
export function deleteSecret(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
}
