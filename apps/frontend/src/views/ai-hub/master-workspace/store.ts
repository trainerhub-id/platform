import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { createMockAiMasterApi } from './api';
import type { AiMasterApi, AiMasterFieldKey, AiMasterWorkspaceState } from './contracts';

export type AiMasterWorkspaceStoreState = {
  state: AiMasterWorkspaceState | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  composerValue: string;
  setComposerValue(value: string): void;
  load(): Promise<void>;
  sendMessage(message?: string): Promise<void>;
  acceptSlot(field: AiMasterFieldKey): Promise<void>;
  updateSlot(field: AiMasterFieldKey, value: string): Promise<void>;
  searchSkkni(): Promise<void>;
  selectSkkniUnit(unitId: string): Promise<void>;
  generateAllDocuments(): Promise<void>;
};

export function createAiMasterWorkspaceStore(api: AiMasterApi) {
  return createStore<AiMasterWorkspaceStoreState>((set, get) => ({
    state: null,
    isLoading: false,
    isSending: false,
    error: null,
    composerValue: '',

    setComposerValue(value) {
      set({ composerValue: value });
    },

    async load() {
      set({ isLoading: true, error: null });
      try {
        const state = await api.loadWorkspace();
        set({ state, isLoading: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Gagal memuat workspace.', isLoading: false });
      }
    },

    async sendMessage(message) {
      const content = (message ?? get().composerValue).trim();
      if (!content) return;

      set({ isSending: true, error: null });
      try {
        const result = await api.sendMessage(content);
        set({ state: result.state, composerValue: '', isSending: false });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Gagal mengirim pesan.', isSending: false });
      }
    },

    async acceptSlot(field) {
      const state = await api.acceptSlot(field);
      set({ state });
    },

    async updateSlot(field, value) {
      const state = await api.updateSlot(field, value);
      set({ state });
    },

    async searchSkkni() {
      const state = await api.searchSkkni();
      set({ state });
    },

    async selectSkkniUnit(unitId) {
      const state = await api.selectSkkniUnit(unitId);
      set({ state });
    },

    async generateAllDocuments() {
      const state = await api.generateAllDocuments();
      set({ state });
    },
  }));
}

const defaultStore = createAiMasterWorkspaceStore(createMockAiMasterApi());

export function useAiMasterWorkspaceStore<T>(selector: (state: AiMasterWorkspaceStoreState) => T): T {
  return useStore(defaultStore, selector);
}
