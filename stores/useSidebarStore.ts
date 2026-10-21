import { create } from "zustand";

interface SidebarState {
  // Desktop (lg and up): icon-only rail.
  isCollapsed: boolean;
  // Below lg: the sidebar is an off-canvas drawer.
  isMobileOpen: boolean;
}

interface SidebarActions {
  toggleCollapsed: () => void;
  setCollapsed: (isCollapsed: boolean) => void;
  openMobile: () => void;
  closeMobile: () => void;
}

type SidebarStore = SidebarState & SidebarActions;

const InitialState: SidebarState = {
  isCollapsed: false,
  isMobileOpen: false,
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  ...InitialState,
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (isCollapsed) => set({ isCollapsed }),
  openMobile: () => set({ isMobileOpen: true }),
  closeMobile: () => set({ isMobileOpen: false }),
}));
