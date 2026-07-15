import { create } from 'zustand';

type UiState = {
  sidebarRecolhida: boolean;
  alternarSidebar: () => void;
};

/**
 * Estado global simples do "Shell" da aplicação. Fica em Zustand em vez de
 * React Query porque não é dado de servidor — é preferência de UI, efêmera,
 * sem necessidade de cache/revalidação.
 */
export const useUiStore = create<UiState>((set) => ({
  sidebarRecolhida: false,
  alternarSidebar: () => set((state) => ({ sidebarRecolhida: !state.sidebarRecolhida })),
}));
