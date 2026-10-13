import { useSyncExternalStore } from 'react';

import { uiStore, type UiState } from '@/lib/ui-store';

/** Selector-based access to the global UI store. */
export function useUiStore<T>(selector: (state: UiState) => T): T {
  return useSyncExternalStore(
    uiStore.subscribe,
    () => selector(uiStore.getState()),
    () => selector(uiStore.getState()),
  );
}
