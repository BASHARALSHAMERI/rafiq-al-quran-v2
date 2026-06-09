import { create } from "zustand";
import {
  clearAuthSession,
  hasRefreshSession,
  setRefreshSessionAvailable
} from "./session";
import type { AuthSessionResponse, AuthUser } from "./types";

type AuthStoreState = {
  accessToken: string | null;
  user: AuthUser | null;
  hasBootstrapped: boolean;
  isBootstrapping: boolean;
  setSession: (session: AuthSessionResponse) => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  accessToken: null,
  user: null,
  hasBootstrapped: false,
  isBootstrapping: false,

  setSession: (session) => {
    setRefreshSessionAvailable(true, session.refreshToken);

    set((state) => ({
      accessToken: session.accessToken,
      user: session.user ?? state.user
    }));
  },

  setUser: (user) => {
    set({ user });
  },

  clearAuth: () => {
    clearAuthSession();
    set({
      accessToken: null,
      user: null
    });
  },

  bootstrap: async () => {
    if (get().hasBootstrapped || get().isBootstrapping) {
      return;
    }

    set({ isBootstrapping: true });

    if (!hasRefreshSession()) {
      set({
        accessToken: null,
        user: null,
        hasBootstrapped: true,
        isBootstrapping: false
      });

      return;
    }

    try {
      const { authApi } = await import("./auth.api");
      const refreshedToken = await authApi.bootstrapSession();

      if (!refreshedToken) {
        set({
          accessToken: null,
          user: null,
          hasBootstrapped: true,
          isBootstrapping: false
        });

        return;
      }

      // [FIX] user is already set by `setSession` inside `requestRefreshToken` in `http.ts`
      // We don't need to call authApi.me() here, which saves a full round trip!
      set({
        accessToken: refreshedToken,
        hasBootstrapped: true,
        isBootstrapping: false
      });
    } catch {
      clearAuthSession();
      set({
        accessToken: null,
        user: null,
        hasBootstrapped: true,
        isBootstrapping: false
      });
    }
  },

  logout: async () => {
    try {
      const { authApi } = await import("./auth.api");
      await authApi.logout();
    } finally {
      clearAuthSession();
      set({ accessToken: null, user: null });
    }
  }
}));
