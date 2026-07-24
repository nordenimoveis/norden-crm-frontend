import { create } from 'zustand';

type MensagemSugerida = {
  leadId: string;
  texto: string;
};

type UiState = {
  sidebarRecolhida: boolean;
  alternarSidebar: () => void;
  mensagemSugerida: MensagemSugerida | null;
  definirMensagemSugerida: (msg: MensagemSugerida | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarRecolhida: false,
  alternarSidebar: () => set((state) => ({ sidebarRecolhida: !state.sidebarRecolhida })),
  mensagemSugerida: null,
  definirMensagemSugerida: (msg) => set({ mensagemSugerida: msg }),
}));
