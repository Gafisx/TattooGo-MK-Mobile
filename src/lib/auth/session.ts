/**
 * Native port of the web session hygiene helpers used by the sign-in/sign-up
 * flows: `raceWithTimeout` keeps the UI responsive when the Clerk client hangs,
 * and `wipeStaleSession` clears any session that is still pinned to the device
 * so a fresh sign-up/sign-in is not rejected with `session_exists`.
 */

const DEFAULT_TIMEOUT_MS = 4000;

/**
 * Resolves with the promise value, or `null` when `timeoutMs` elapses first.
 * Rejections inside the raced promise are also collapsed to `null` so callers
 * can treat the whole thing as a best-effort probe.
 */
export function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
  return new Promise<T | null>((resolve) => {
    let settled = false;

    const settle = (value: T | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => settle(null), timeoutMs);

    promise.then(
      (value) => settle(value),
      () => settle(null),
    );
  });
}

/** Minimal structural contract of the Clerk `signOut` we depend on. */
export interface StaleSessionHandle {
  signOut: () => Promise<void>;
}

/**
 * Best-effort cleanup of a stale Clerk session before starting a new attempt.
 * Never throws and never blocks the flow for longer than `raceWithTimeout`.
 */
export async function wipeStaleSession(
  handle: StaleSessionHandle | null | undefined,
): Promise<void> {
  if (!handle) return;
  try {
    await raceWithTimeout(handle.signOut());
  } catch {
    // Best-effort only: a failed wipe must never block authentication.
  }
}
