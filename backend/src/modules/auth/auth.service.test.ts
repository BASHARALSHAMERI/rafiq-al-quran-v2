import { Role } from "@prisma/client";
import { authService } from "./auth.service";
import { authRepository } from "./auth.repository";

// ─── Mocks ───
jest.mock("./auth.repository", () => ({
  authRepository: {
    findByIdentifier: jest.fn(),
    createRefreshToken: jest.fn(),
    createActivityLog: jest.fn(),
    markUserLastLogin: jest.fn(),
    findById: jest.fn(),
    revokeRefreshTokenByHash: jest.fn(),
  },
}));

jest.mock("../../shared/utils/jwt", () => ({
  signAccessToken: jest.fn(() => "mock_access_token"),
  signRefreshToken: jest.fn(() => "mock_refresh_token"),
  verifyRefreshToken: jest.fn(),
  getTokenExpiryDate: jest.fn(() => new Date("2099-01-01")),
}));

jest.mock("../../shared/utils/password", () => ({
  hashPassword: jest.fn((pwd: string) => Promise.resolve(`hashed_${pwd}`)),
  verifyPassword: jest.fn((plain: string, hash: string) =>
    Promise.resolve(hash === `hashed_${plain}`)
  ),
}));

jest.mock("../../shared/utils/token-hash", () => ({
  hashToken: jest.fn((token: string) => `hash_${token}`),
}));

jest.mock("../../shared/email/email.service", () => ({
  emailService: {
    sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("../../config/env", () => ({
  env: {
    FRONTEND_BASE_URL: "http://localhost:5173",
    CORS_ORIGIN: "http://localhost:5173",
    JWT_ACCESS_EXPIRES_IN: "15m",
    PASSWORD_RESET_TOKEN_TTL_MINUTES: 60,
    NODE_ENV: "test",
  },
}));

jest.mock("../../shared/logger/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const expectAppError = async (
  action: Promise<unknown>,
  expected: { statusCode: number; code?: string }
) => {
  await expect(action).rejects.toMatchObject(expected);
};

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    email: "test@example.com",
    fullName: "Test User",
    role: Role.CENTER_ADMIN,
    isActive: true,
    passwordHash: "hashed_password123",
    organizationId: 1,
    profile: { avatarUrl: null, phoneNormalized: null, gender: null },
    organization: { name: "Test Org", logoUrl: null },
  };

  const clientInfo = { userAgent: "jest", ipAddress: "127.0.0.1", platform: "web" as const };

  describe("login", () => {
    it("should throw 401 when user not found", async () => {
      (authRepository.findByIdentifier as jest.Mock).mockResolvedValue(null);

      await expectAppError(
        authService.login({ identifier: "unknown", password: "pass" }, clientInfo),
        { statusCode: 401, code: "AUTH_INVALID_CREDENTIALS" }
      );
    });

    it("should throw 401 when user is inactive", async () => {
      (authRepository.findByIdentifier as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

      await expectAppError(
        authService.login({ identifier: "test", password: "pass" }, clientInfo),
        { statusCode: 401, code: "AUTH_INVALID_CREDENTIALS" }
      );
    });

    it("should throw 403 when web user tries mobile-only role", async () => {
      (authRepository.findByIdentifier as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: Role.TEACHER,
      });

      await expectAppError(
        authService.login({ identifier: "teacher", password: "pass" }, { ...clientInfo, platform: "web" }),
        { statusCode: 403, code: "AUTH_FORBIDDEN_PLATFORM" }
      );
    });

    it("should throw 401 when password is not set", async () => {
      (authRepository.findByIdentifier as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      await expectAppError(
        authService.login({ identifier: "test", password: "pass" }, clientInfo),
        { statusCode: 401, code: "AUTH_PASSWORD_NOT_SET" }
      );
    });

    it("should throw 401 when password is incorrect", async () => {
      (authRepository.findByIdentifier as jest.Mock).mockResolvedValue(mockUser);

      await expectAppError(
        authService.login({ identifier: "test", password: "wrongpassword" }, clientInfo),
        { statusCode: 401, code: "AUTH_INVALID_CREDENTIALS" }
      );
    });

    it("should return tokens and user on successful login", async () => {
      (authRepository.findByIdentifier as jest.Mock).mockResolvedValue(mockUser);
      (authRepository.createRefreshToken as jest.Mock).mockResolvedValue(undefined);
      (authRepository.createActivityLog as jest.Mock).mockResolvedValue(undefined);
      (authRepository.markUserLastLogin as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.login(
        { identifier: "test@example.com", password: "password123" },
        clientInfo
      );

      expect(result.accessToken).toBe("mock_access_token");
      expect(result.refreshToken).toBe("mock_refresh_token");
      expect(result.user).toMatchObject({
        id: 1,
        email: "test@example.com",
        fullName: "Test User",
        role: Role.CENTER_ADMIN,
      });

      expect(authRepository.createActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 1,
          userId: 1,
          activityType: "LOGIN",
        })
      );
      expect(authRepository.markUserLastLogin).toHaveBeenCalledWith(1);
    });
  });

  describe("checkUser", () => {
    it("should return exists=false for unknown user", async () => {
      (authRepository.findByIdentifier as jest.Mock).mockResolvedValue(null);

      const result = await authService.checkUser({ identifier: "unknown@test.com" });
      expect(result).toEqual({ exists: false, hasPassword: false });
    });

    it("should return exists=true with hasPassword for active user", async () => {
      (authRepository.findByIdentifier as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.checkUser({ identifier: "test@example.com" });
      expect(result).toEqual({ exists: true, hasPassword: true });
    });

    it("should return hasPassword=false when user has no password", async () => {
      (authRepository.findByIdentifier as jest.Mock).mockResolvedValue({ ...mockUser, passwordHash: null });

      const result = await authService.checkUser({ identifier: "test@example.com" });
      expect(result).toEqual({ exists: true, hasPassword: false });
    });
  });

  describe("logout", () => {
    it("should return early when no refresh token", async () => {
      await expect(authService.logout(null)).resolves.toBeUndefined();
      expect(authRepository.revokeRefreshTokenByHash).not.toHaveBeenCalled();
    });
  });

  describe("me", () => {
    it("should throw 404 when user not found", async () => {
      (authRepository.findById as jest.Mock).mockResolvedValue(null);

      await expectAppError(authService.me(999), { statusCode: 404 });
    });

    it("should throw 404 when user is inactive", async () => {
      (authRepository.findById as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

      await expectAppError(authService.me(1), { statusCode: 404 });
    });

    it("should return user data for active user", async () => {
      (authRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.me(1);
      expect(result).toMatchObject({
        id: 1,
        email: "test@example.com",
        fullName: "Test User",
        role: Role.CENTER_ADMIN,
      });
    });
  });
});
