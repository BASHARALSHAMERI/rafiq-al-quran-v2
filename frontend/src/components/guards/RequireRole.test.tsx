import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RequireRole from "./RequireRole";
import { useAuthStore } from "../../features/auth/auth.store";

describe("RequireRole", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      user: null,
      hasBootstrapped: false,
      isBootstrapping: false,
    });
  });

  it("should redirect to login when no user", () => {
    render(
      <MemoryRouter>
        <RequireRole allowedRoles={["CENTER_ADMIN"]}>
          <div data-testid="protected">Protected Content</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
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

    render(
      <MemoryRouter>
        <RequireRole allowedRoles={["CENTER_ADMIN", "SUPER_ADMIN"]}>
          <div data-testid="protected">Protected Content</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.getByTestId("protected")).toBeInTheDocument();
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

    render(
      <MemoryRouter>
        <RequireRole allowedRoles={["CENTER_ADMIN"]}>
          <div data-testid="protected">Protected Content</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
  });
});
