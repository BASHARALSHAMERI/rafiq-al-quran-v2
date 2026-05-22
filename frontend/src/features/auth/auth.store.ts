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
    setRefreshSessionAvailable(true);

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

      // [FIX] بعد نجاح الـ refresh، كان user يبقى null حتى يأتي طلب آخر.
      // الآن نجلب بيانات المستخدم فوراً قبل ضبط hasBootstrapped=true،
      // مما يمنع وميض "غير مخوّل" ويضمن صحة الـ UI من أول render.
      let user: AuthUser | null = null;
      try {
        user = await authApi.me();
      } catch {
        // [FIX] إذا فشل جلب بيانات المستخدم (غير متوقع)،
        // نُسجّل الخروج تلقائياً بدلاً من إبقاء النظام في حالة غير متسقة.
        clearAuthSession();
        set({
          accessToken: null,
          user: null,
          hasBootstrapped: true,
          isBootstrapping: false
        });
        return;
      }

      set({
        accessToken: refreshedToken,
        user,                     // [FIX] user متاح الآن قبل hasBootstrapped
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
