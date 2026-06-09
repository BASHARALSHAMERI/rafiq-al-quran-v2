import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth.store";

describe("auth.store", () => {
  beforeEach(() => {
    // Reset Zustand store to initial state between tests
    useAuthStore.setState({
      accessToken: null,
      user: null,
      hasBootstrapped: false,
      isBootstrapping: false,
    });
    // Clean up sessionStorage
    window.sessionStorage.clear();
  });

  it("should have initial state", () => {
    const state = useAuthStore.getState();

    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.hasBootstrapped).toBe(false);
    expect(state.isBootstrapping).toBe(false);
  });

  it("setSession should update accessToken and user", () => {
    const session = {
      accessToken: "test_access_token",
      accessExpiresIn: "3600",
      refreshToken: "test_refresh_token",
      user: {
        id: 1,
        email: "test@example.com",
        fullName: "Test User",
        role: "CENTER_ADMIN" as const,
      },
    };

    useAuthStore.getState().setSession(session);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("test_access_token");
    expect(state.user).toEqual(session.user);
  });

  it("setUser should update only the user", () => {
    useAuthStore.getState().setUser({
      id: 2,
      email: "admin@example.com",
      fullName: "Admin User",
      role: "SUPER_ADMIN" as const,
    });

    const state = useAuthStore.getState();
    expect(state.user?.role).toBe("SUPER_ADMIN");
    expect(state.accessToken).toBeNull();
  });

  it("clearAuth should reset everything", () => {
    useAuthStore.getState().setSession({
      accessToken: "token",
      accessExpiresIn: "3600",
      user: {
        id: 1,
        email: "test@example.com",
        fullName: "Test",
        role: "TEACHER" as const,
      },
    });

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("bootstrap should set hasBootstrapped when no refresh session exists", async () => {
    await useAuthStore.getState().bootstrap();

    const state = useAuthStore.getState();
    expect(state.hasBootstrapped).toBe(true);
    expect(state.isBootstrapping).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it("bootstrap should be idempotent (skip if already bootstrapped)", async () => {
    useAuthStore.setState({ hasBootstrapped: true });

    // If bootstrap runs again it should return early without errors
    await expect(useAuthStore.getState().bootstrap()).resolves.toBeUndefined();
  });

  it("bootstrap should skip if already bootstrapping", async () => {
    useAuthStore.setState({ isBootstrapping: true });

    await expect(useAuthStore.getState().bootstrap()).resolves.toBeUndefined();
  });
});
