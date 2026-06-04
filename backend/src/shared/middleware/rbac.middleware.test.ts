import { requireRoles } from "./rbac.middleware";
import { Role } from "@prisma/client";
import { AppError } from "../errors/app-error";

describe("requireRoles", () => {
  const mockNext = jest.fn();

  beforeEach(() => {
    mockNext.mockClear();
  });

  it("should call next with 401 when no auth", () => {
    const middleware = requireRoles([Role.SUPER_ADMIN]);
    const req = { auth: undefined } as any;
    const res = {} as any;

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Authentication required");
  });

  it("should call next with 403 when role is not allowed", () => {
    const middleware = requireRoles([Role.SUPER_ADMIN]);
    const req = { auth: { role: Role.STUDENT }, path: "/test", method: "GET" } as any;
    const res = {} as any;

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe("Forbidden");
    expect(error.details).toEqual(
      expect.objectContaining({
        currentRole: "STUDENT",
        allowedRoles: expect.arrayContaining(["SUPER_ADMIN"]),
      })
    );
  });

  it("should call next() without error when role is explicitly allowed", () => {
    const middleware = requireRoles([Role.CENTER_ADMIN, Role.SUPER_ADMIN]);
    const req = { auth: { role: Role.SUPER_ADMIN }, path: "/test", method: "GET" } as any;
    const res = {} as any;

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should allow TEACHER on monthly-plans routes via fallback", () => {
    const middleware = requireRoles([Role.SUPER_ADMIN]);
    const req = { auth: { role: Role.TEACHER }, path: "/monthly-plans", method: "GET" } as any;
    const res = {} as any;

    middleware(req, res, mockNext);

    // TEACHER is in monthlyPlanFallbackRoles, so should pass
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should allow STUDENT on remote-recitation routes via fallback", () => {
    const middleware = requireRoles([Role.SUPER_ADMIN]);
    const req = { auth: { role: Role.STUDENT }, path: "/remote-recitation/settings", method: "GET" } as any;
    const res = {} as any;

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should deny PARENT on admin-only route without fallback", () => {
    const middleware = requireRoles([Role.SUPER_ADMIN]);
    const req = { auth: { role: Role.PARENT }, path: "/users", method: "GET" } as any;
    const res = {} as any;

    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    const error = mockNext.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });
});
