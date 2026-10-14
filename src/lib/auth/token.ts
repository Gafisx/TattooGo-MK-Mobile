import { getClerkInstance } from '@clerk/clerk-expo';

import { isAuthConfigured } from '@/lib/env';

/**
 * Resolves the active Clerk session token for API requests.
 *
 * This is the native replacement for the legacy web cookie/session: every
 * authenticated call sends `Authorization: Bearer <clerk-token>`. `getClerkInstance`
 * is the documented way to read Clerk outside of React (e.g. from the HTTP
 * client). Returns `null` when auth is not configured or there is no active
 * session, so callers degrade to an unauthenticated request.
 */
export async function getAuthToken(): Promise<string | null> {
  if (!isAuthConfigured) return null;

  try {
    const session = getClerkInstance().session;
    if (!session) return null;
    return (await session.getToken()) ?? null;
  } catch {
    // Auth is best-effort here: a Clerk hiccup must not take down the request.
    return null;
  }
}
