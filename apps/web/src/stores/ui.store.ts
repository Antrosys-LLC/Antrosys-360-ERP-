import { create } from 'zustand';

interface UIState {
  isSidebarCollapsed: boolean;
  pageTitle: string;
  toggleSidebar: () => void;
  setPageTitle: (title: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  pageTitle: 'Dashboard',
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setPageTitle: (title) => set({ pageTitle: title }),
}));
