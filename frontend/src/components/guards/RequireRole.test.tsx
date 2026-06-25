import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RequireRole from "./RequireRole";
import { useAuthStore } from "../../features/auth/auth.store";

let root: Root | null = null;
let container: HTMLDivElement | null = null;

const renderGuard = (allowedRoles: string[], childTestId = "protected") => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root?.render(
      <MemoryRouter>
        <RequireRole allowedRoles={allowedRoles}>
          <div data-testid={childTestId}>Protected Content</div>
        </RequireRole>
      </MemoryRouter>
    );
  });
};

describe("RequireRole", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      user: null,
      hasBootstrapped: false,
      isBootstrapping: false,
    });
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  it("should redirect to login when no user", () => {
    renderGuard(["CENTER_ADMIN"]);

    expect(container?.querySelector('[data-testid="protected"]')).toBeNull();
  });

  it("should render children when role is allowed", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        email: "admin@example.com",
        fullName: "Admin",
        role: "CENTER_ADMIN",
      },
    });

    renderGuard(["CENTER_ADMIN", "SUPER_ADMIN"]);

    expect(container?.querySelector('[data-testid="protected"]')).not.toBeNull();
  });

  it("should redirect to 403 when role is not allowed", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        email: "student@example.com",
        fullName: "Student",
        role: "STUDENT",
      },
    });

    renderGuard(["CENTER_ADMIN"]);

    expect(container?.querySelector('[data-testid="protected"]')).toBeNull();
  });
});
