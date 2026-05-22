import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppTheme = "light" | "dark";

type UiStoreState = {
  theme: AppTheme;
  sidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  setMobileMenuOpen: (value: boolean) => void;
  initTheme: () => void;
};

export const useUiStore = create<UiStoreState>()(
  persist(
    (set, get) => ({
      theme: "light",
      sidebarCollapsed: false,
      isMobileMenuOpen: false,

      // Initialize theme on app load
      initTheme: () => {
        const currentTheme = get().theme;
        document.documentElement.setAttribute("data-theme", currentTheme);
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";

          // Add transition class
          document.body.classList.add("theme-transitioning");

          // Update data-theme attribute
          document.documentElement.setAttribute("data-theme", newTheme);

          // Remove transition class after animation
          setTimeout(() => {
            document.body.classList.remove("theme-transitioning");
          }, 300);

          return { theme: newTheme };
        });
      },

      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed
        }));
      },

      toggleMobileMenu: () => {
        set((state) => ({
          isMobileMenuOpen: !state.isMobileMenuOpen
        }));
      },

      setSidebarCollapsed: (value: boolean) => {
        set({ sidebarCollapsed: value });
      },

      setMobileMenuOpen: (value: boolean) => {
        set({ isMobileMenuOpen: value });
      }
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
);
