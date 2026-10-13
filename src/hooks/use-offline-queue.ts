import { useSyncExternalStore } from 'react';

import { offlineQueue, type OfflineQueueState } from '@/lib/offline-queue';

const getState = () => offlineQueue.getState();

/**
 * Selector-based access to the offline queue (zustand-like ergonomics without
 * the dependency): `const enqueue = useOfflineQueue((s) => s.enqueue);`
 */
export function useOfflineQueue<T>(selector: (state: OfflineQueueState) => T): T {
  return useSyncExternalStore(offlineQueue.subscribe, () => selector(getState()), () =>
    selector(getState()),
  );
}
