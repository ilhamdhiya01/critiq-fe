import { create } from "zustand";

interface SidebarState {
  isCollapsed: boolean;
}

interface SidebarActions {
  toggleCollapsed: () => void;
  setCollapsed: (isCollapsed: boolean) => void;
}

type SidebarStore = SidebarState & SidebarActions;

const InitialState: SidebarState = {
  isCollapsed: false,
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  ...InitialState,
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (isCollapsed) => set({ isCollapsed }),
}));
