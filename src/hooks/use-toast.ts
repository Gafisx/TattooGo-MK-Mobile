import { useSyncExternalStore } from 'react';

import { toast, type ToastItem } from '@/lib/toast-store';

/** Subscribe to the visible toast stack (newest first). */
export function useToasts(): ToastItem[] {
  return useSyncExternalStore(toast.subscribe, toast.getState, toast.getState);
}
