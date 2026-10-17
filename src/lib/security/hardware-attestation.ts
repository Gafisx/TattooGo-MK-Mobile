/**
 * Hardware-level app attestation.
 *
 * TEMPORARY (debug): the native provider is disabled while we isolate an
 * Android dev-client hard crash on SDK 57. `@expo/app-integrity` (alpha) was
 * removed from the dependencies and every native call now resolves as
 * unavailable, so the API client sends requests without the
 * `X-App-Integrity-Token` header and the backend applies its own policy.
 *
 * This keeps the public surface used by `api.ts` and `bootstrap.ts` stable, so
 * the provider can be restored later without touching callers.
 */

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

/** Attestation is temporarily unavailable: always resolves `null`. */
export async function getIntegrityToken(
  _options: IntegrityTokenOptions = {},
): Promise<string | null> {
  return null;
}

/** No-op while the native provider is disabled. */
export async function prepareHardwareAttestation(): Promise<void> {
  return;
}

/** No-op while the native provider is disabled. */
export async function resetHardwareAttestation(): Promise<void> {
  return;
}
