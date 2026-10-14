import { parseKycStatus, type KycStatus } from '@/lib/kyc';
import { parseAppRole, type AppRole } from '@/lib/utils/dashboard-gate';

/**
 * Session/role store nativo.
 *
 * Espelha o `Perfil`/`perfil-session` do web: mantém a role reconciliada
 * (`requesterRole`) e o estado de KYC do utilizador autenticado. É a fonte
 * local consultada pelo gate do tatuador em conjunto com os metadados do Clerk
 * (`publicMetadata`/`unsafeMetadata`).
 *
 * Segue o mesmo padrão de store externa dos `uiStore`/`i18nStore` para ser
 * consumido via `useSyncExternalStore` (hook `useSession`).
 */

export interface SessionState {
  role: AppRole | null;
  kycStatus: KycStatus | null;
  /** `true` depois que a sessão foi reconciliada (Clerk ou estado local). */
  hydrated: boolean;
}

export interface SessionPatch {
  role?: AppRole | null;
  kycStatus?: KycStatus | null;
}

export interface SessionStore extends SessionState {
  setSession: (patch: SessionPatch) => void;
  setKycStatus: (status: KycStatus | null) => void;
  clearSession: () => void;
}

let state: SessionState = { role: null, kycStatus: null, hydrated: false };

const listeners = new Set<() => void>();

function broadcast(): void {
  listeners.forEach((listener) => listener());
}

function setSession(patch: SessionPatch): void {
  state = {
    role: patch.role !== undefined ? patch.role : state.role,
    kycStatus: patch.kycStatus !== undefined ? patch.kycStatus : state.kycStatus,
    hydrated: true,
  };
  snapshot = { ...state, setSession, setKycStatus, clearSession };
  broadcast();
}

function setKycStatus(status: KycStatus | null): void {
  setSession({ kycStatus: status });
}

function clearSession(): void {
  state = { role: null, kycStatus: null, hydrated: true };
  snapshot = { ...state, setSession, setKycStatus, clearSession };
  broadcast();
}

/** Reconciles the raw role/KYC values coming from Clerk metadata or a persisted profile. */
export function reconcileSession(input: {
  role?: unknown;
  kycStatus?: unknown;
}): void {
  setSession({
    role: parseAppRole(input.role),
    kycStatus: parseKycStatus(input.kycStatus),
  });
}

let snapshot: SessionStore = {
  ...state,
  setSession,
  setKycStatus,
  clearSession,
};

export const sessionStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): SessionStore {
    return snapshot;
  },

  setSession,
  setKycStatus,
  clearSession,
};
