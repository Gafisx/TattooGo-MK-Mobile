import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { likeArtwork } from '@/lib/services/galeria';

export interface QueuedAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

export interface OfflineQueueState {
  pending: QueuedAction[];
  isFlushing: boolean;
  enqueue: (type: string, payload: Record<string, unknown>) => void;
  flush: () => Promise<void>;
}

const STORAGE_KEY = 'tattoogo-offline-queue';

let pending: QueuedAction[] = [];
let isFlushing = false;
let hydrated = false;
let flushInFlight = false;
let unsubscribeNetInfo: (() => void) | null = null;

const listeners = new Set<() => void>();

function broadcast(): void {
  listeners.forEach((listener) => listener());
}

let snapshot: OfflineQueueState = {
  pending,
  isFlushing,
  enqueue,
  flush,
};

function refreshSnapshot(): void {
  snapshot = { pending, isFlushing, enqueue, flush };
  broadcast();
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // best-effort; the in-memory queue still drains on next foreground.
  }
}

async function restore(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as QueuedAction[];
    if (Array.isArray(parsed)) {
      pending = parsed.filter((item) => item && typeof item.id === 'string');
      refreshSnapshot();
    }
  } catch {
    // ignore malformed payloads
  }
}

function createAction(type: string, payload: Record<string, unknown>): QueuedAction {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: Date.now(),
  };
}

/**
 * Replays queued mutations (currently only `like`). Runs only when connected;
 * a failed action stays queued to avoid losing user intent.
 */
async function flush(): Promise<void> {
  if (flushInFlight || pending.length === 0) return;

  const net = await NetInfo.fetch().catch(() => null);
  if (!net?.isConnected) return;

  flushInFlight = true;
  isFlushing = true;
  refreshSnapshot();

  const remaining: QueuedAction[] = [];
  for (const action of pending) {
    try {
      if (action.type === 'like') {
        const id = String(action.payload.id ?? '');
        if (!id) continue;
        await likeArtwork(id);
      }
      // Unknown action types are intentionally dropped to avoid a poison queue.
    } catch {
      remaining.push(action);
    }
  }

  pending = remaining;
  flushInFlight = false;
  isFlushing = false;
  await persist();
  refreshSnapshot();
}

export function enqueue(type: string, payload: Record<string, unknown>): void {
  pending = [...pending, createAction(type, payload)];
  refreshSnapshot();
  void persist();
  void flush();
}

export const offlineQueue = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): OfflineQueueState {
    return snapshot;
  },

  enqueue,
  flush,

  /** Restores persisted actions and starts flushing whenever connectivity returns. */
  async hydrate(): Promise<void> {
    if (hydrated) return;
    hydrated = true;
    await restore();
    if (!unsubscribeNetInfo) {
      unsubscribeNetInfo = NetInfo.addEventListener((net) => {
        if (net.isConnected) void flush();
      });
    }
    void flush();
  },
};
