import { useSyncExternalStore } from 'react';

import { sessionStore, type SessionStore } from '@/lib/session-store';

/** Access to the reconciled session (role + KYC status). */
export function useSession(): SessionStore {
  return useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getState,
    sessionStore.getState,
  );
}
