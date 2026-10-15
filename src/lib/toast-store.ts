export type ToastVariant = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  title?: string;
  variant: ToastVariant;
  /** Auto-dismiss delay in milliseconds. */
  duration: number;
}

export interface ToastOptions {
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

const DEFAULT_DURATION_MS = 3200;
/** Keep the stack short so toasts never cover the whole screen. */
const MAX_VISIBLE_TOASTS = 3;

let nextId = 1;
let state: ToastItem[] = [];

const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function clearTimer(id: number): void {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

function dismiss(id: number): void {
  clearTimer(id);
  const next = state.filter((item) => item.id !== id);
  if (next.length === state.length) return;
  state = next;
  emit();
}

/**
 * Enqueue a toast. Newest first; when the stack exceeds `MAX_VISIBLE_TOASTS`
 * the oldest entries are dropped (and their timers cleared).
 */
function show(message: string, options: ToastOptions = {}): number {
  const id = nextId;
  nextId += 1;

  const item: ToastItem = {
    id,
    message,
    title: options.title,
    variant: options.variant ?? 'info',
    duration: options.duration ?? DEFAULT_DURATION_MS,
  };

  const next = [item, ...state];
  const dropped = next.slice(MAX_VISIBLE_TOASTS);
  dropped.forEach((entry) => clearTimer(entry.id));
  state = next.slice(0, MAX_VISIBLE_TOASTS);
  emit();

  timers.set(
    id,
    setTimeout(() => dismiss(id), item.duration),
  );

  return id;
}

/**
 * Imperative toast API (port of the web `toast` helper). Mirrors the tiny
 * `uiStore` pattern: a module-level store consumed via `useToasts`.
 */
export const toast = {
  show,
  info(message: string, options?: ToastOptions): number {
    return show(message, { ...options, variant: 'info' });
  },
  success(message: string, options?: ToastOptions): number {
    return show(message, { ...options, variant: 'success' });
  },
  error(message: string, options?: ToastOptions): number {
    return show(message, { ...options, variant: 'error' });
  },
  dismiss,
  clear(): void {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    if (state.length === 0) return;
    state = [];
    emit();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getState(): ToastItem[] {
    return state;
  },
};
