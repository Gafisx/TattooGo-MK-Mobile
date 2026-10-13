import { useSyncExternalStore } from 'react';

import { uiStore, type UiStore } from '@/lib/ui-store';

/** Selector-based access to the global UI store (state + actions). */
export function useUiStore<T>(selector: (state: UiStore) => T): T {
  return useSyncExternalStore(
    uiStore.subscribe,
    () => selector(uiStore.getState()),
    () => selector(uiStore.getState()),
  );
}
