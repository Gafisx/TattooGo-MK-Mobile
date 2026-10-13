export type AppTab = 'index' | 'agendar' | 'chat' | 'perfil' | 'galeria';

export interface UiState {
  activeTab: AppTab;
  pendingChatPeer: string | null;
  pendingChatArtwork: string | null;
}

export interface UiStore extends UiState {
  setActiveTab: (tab: AppTab) => void;
  setPendingChatPeer: (peer: string | null) => void;
  setPendingChatArtwork: (artwork: string | null) => void;
}

let state: UiState = {
  activeTab: 'index',
  pendingChatPeer: null,
  pendingChatArtwork: null,
};

const listeners = new Set<() => void>();

function broadcast(): void {
  listeners.forEach((listener) => listener());
}

function commit(patch: Partial<UiState>): void {
  state = { ...state, ...patch };
  snapshot = { ...state, setActiveTab, setPendingChatPeer, setPendingChatArtwork };
  broadcast();
}

function setActiveTab(tab: AppTab): void {
  commit({ activeTab: tab });
}

function setPendingChatPeer(peer: string | null): void {
  commit({ pendingChatPeer: peer });
}

function setPendingChatArtwork(artwork: string | null): void {
  commit({ pendingChatArtwork: artwork });
}

let snapshot: UiStore = {
  ...state,
  setActiveTab,
  setPendingChatPeer,
  setPendingChatArtwork,
};

/**
 * Tiny global UI store (port of the web `useUiStore`) used to hand the
 * "start conversation" intent over to the chat tab.
 */
export const uiStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getState(): UiStore {
    return snapshot;
  },

  setActiveTab,
  setPendingChatPeer,
  setPendingChatArtwork,
};
