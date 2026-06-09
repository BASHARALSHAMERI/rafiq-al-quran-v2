import { ActivityType, Role } from "@prisma/client";
import { randomBytes } from "crypto";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";
import { logger } from "../../shared/logger/logger";
import { parseLoginIdentifier } from "../../shared/utils/identifier";
import { hashToken } from "../../shared/utils/token-hash";
import {
  getTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../../shared/utils/jwt";
import { hashPassword, verifyPassword } from "../../shared/utils/password";
import { emailService } from "../../shared/email/email.service";
import { authRepository, type AuthUser } from "./auth.repository";

type AuthUserResponse = {
  id: number;
  email: string;
  fullName: string;
  role: AuthUser["role"];
  avatarUrl?: string | null;
  phone?: string | null;
  gender?: string | null;
  organizationName?: string;
  organizationLogoUrl?: string | null;
  // TRANSIENT: timeFormat lives here temporarily until a proper
  // OrganizationSettings layer is introduced. Do NOT add timezone,
  // currency, language, dateFormat, or hijriEnabled to this type.
  timeFormat?: "HOUR_12" | "HOUR_24";
};

type ClientInfo = {
  userAgent?: string;
  ipAddress?: string;
  platform?: "web" | "mobile";
};

const INVALID_CREDENTIALS_MESSAGE = "بيانات الدخول غير صحيحة";
const FORGOT_PASSWORD_GENERIC_MESSAGE =
  "إذا كانت بيانات الحساب صحيحة، فسيتم إرسال تعليمات إعادة التعيين.";
const INVALID_RESET_TOKEN_MESSAGE = "رمز إعادة التعيين غير صالح أو منتهي الصلاحية";
const WEB_ACCESS_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.CENTER_ADMIN,
  Role.ACCOUNTANT,
  Role.FINANCE_MANAGER,
  Role.TREASURER,
  Role.AUDITOR
];
const MOBILE_ACCESS_ROLES: Role[] = [Role.SUPERVISOR, Role.TEACHER, Role.PARENT, Role.STUDENT];

const resolveFrontendBaseUrl = () => {
  const base = env.FRONTEND_BASE_URL ?? env.CORS_ORIGIN;
  return base.endsWith("/") ? base.slice(0, -1) : base;
};

const buildResetPasswordUrl = (resetToken: string) => {
  const base = resolveFrontendBaseUrl();
  const encodedToken = encodeURIComponent(resetToken);
  return `${base}/reset-password?token=${encodedToken}`;
};

const toAuthResponseUser = (user: AuthUser): AuthUserResponse => {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.profile?.avatarUrl ?? null,
    phone: user.profile?.phoneNormalized ?? null,
    gender: user.profile?.gender ?? null,
    organizationName: user.organization?.name ?? undefined,
    organizationLogoUrl: user.organization?.logoUrl ?? null,
    timeFormat: user.organization?.attendancePolicy?.timeFormat ?? "HOUR_12"
  };
};

const issueSessionTokens = async (user: AuthUser, clientInfo: ClientInfo) => {
  const claims = {
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId
  };

  const accessToken = signAccessToken(claims);
  const refreshToken = signRefreshToken(claims);

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getTokenExpiryDate(refreshToken),
    userAgent: clientInfo.userAgent,
    ipAddress: clientInfo.ipAddress
  });

  return {
    accessToken,
    refreshToken,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN
  };
};

export const authService = {
  async login(
    input: { identifier?: string; email?: string; password: string },
    clientInfo: ClientInfo
  ) {
    const rawIdentifier = (input.identifier ?? input.email ?? "").trim();
    const parsedIdentifier = parseLoginIdentifier(rawIdentifier);
    const user = await authRepository.findByIdentifier(parsedIdentifier);

    if (!user || !user.isActive) {
      throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401, undefined, "AUTH_INVALID_CREDENTIALS");
    }

    if (clientInfo.platform === "web") {
      if (!WEB_ACCESS_ROLES.includes(user.role)) {
        throw new AppError("نسخة الويب مخصّصة للمدير العام ومدير المركز فقط", 403, undefined, "AUTH_FORBIDDEN_PLATFORM");
      }
    } else {
      if (!MOBILE_ACCESS_ROLES.includes(user.role)) {
        throw new AppError("نسخة الجوال مخصّصة للمعلمين والمشرفين والطلاب وأولياء الأمور فقط", 403, undefined, "AUTH_FORBIDDEN_PLATFORM");
      }
    }

    if (!user.passwordHash) {
      throw new AppError("الحساب يتطلب إنشاء كلمة مرور", 401, undefined, "AUTH_PASSWORD_NOT_SET");
    }

    const validPassword = await verifyPassword(input.password, user.passwordHash);

    if (!validPassword) {
      throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401, undefined, "AUTH_INVALID_CREDENTIALS");
    }

    const tokens = await issueSessionTokens(user, clientInfo);

    await authRepository.createActivityLog({
      organizationId: user.organizationId,
      userId: user.id,
      activityType: ActivityType.LOGIN,
      message: "User logged in"
    });

    await authRepository.markUserLastLogin(user.id);

    return {
      ...tokens,
      user: toAuthResponseUser(user)
    };
  },

  async checkUser(input: { identifier: string }) {
    const parsedIdentifier = parseLoginIdentifier(input.identifier);

    if (parsedIdentifier.kind === "invalid") {
      throw new AppError("المُعرّف غير صالح", 400);
    }

    const user = await authRepository.findByIdentifier(parsedIdentifier);

    if (!user || !user.isActive) {
      return { exists: false, hasPassword: false };
    }

    return {
      exists: true,
      hasPassword: user.passwordHash !== null
    };
  },

  async setupPassword(input: { identifier: string; newPassword: string }) {
    const parsedIdentifier = parseLoginIdentifier(input.identifier);

    if (parsedIdentifier.kind === "invalid") {
      throw new AppError(INVALID_CREDENTIALS_MESSAGE, 400);
    }

    const user = await authRepository.findByIdentifier(parsedIdentifier);

    if (!user || !user.isActive) {
      throw new AppError("المستخدم غير موجود أو غير نشط", 404);
    }

    if (user.passwordHash !== null) {
      throw new AppError("الحساب لديه كلمة مرور بالفعل", 400);
    }

    const passwordHash = await hashPassword(input.newPassword);
    await authRepository.updateUserPassword(user.id, passwordHash);

    await authRepository.createActivityLog({
      organizationId: user.organizationId,
      userId: user.id,
      activityType: ActivityType.GENERIC,
      message: "Initial password setup"
    });

    return { message: "Password setup successful" };
  },

  async forgotPassword(input: { identifier: string }, clientInfo: ClientInfo) {
    const parsedIdentifier = parseLoginIdentifier(input.identifier);

    if (parsedIdentifier.kind !== "invalid") {
      const user = await authRepository.findByIdentifier(parsedIdentifier);

      if (user && user.isActive) {
        const resetToken = randomBytes(32).toString("hex");
        const resetTokenHash = hashToken(resetToken);
        const expiresAt = new Date(
          Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000
        );

        await authRepository.createPasswordResetToken({
          userId: user.id,
          tokenHash: resetTokenHash,
          expiresAt,
          userAgent: clientInfo.userAgent,
          ipAddress: clientInfo.ipAddress
        });

        const resetUrl = buildResetPasswordUrl(resetToken);

        // Send Email asynchronously without blocking
        emailService.sendPasswordResetEmail(user.email, user.fullName, resetUrl).catch((error) => {
          logger.error({ error, userId: user.id }, "Background email sending failed");
        });

        if (env.NODE_ENV !== "production") {
          logger.info(
            {
              userId: user.id,
              organizationId: user.organizationId,
              resetUrl
            },
            "Password reset token issued"
          );
        } else {
          logger.info(
            {
              userId: user.id,
              organizationId: user.organizationId
            },
            "Password reset token issued"
          );
        }

        await authRepository.createActivityLog({
          organizationId: user.organizationId,
          userId: user.id,
          activityType: ActivityType.GENERIC,
          message: "Password reset requested"
        });
      }
    }

    return {
      message: FORGOT_PASSWORD_GENERIC_MESSAGE
    };
  },

  async resetPassword(input: { token: string; newPassword: string }) {
    const tokenHash = hashToken(input.token.trim());
    const tokenRecord = await authRepository.findValidPasswordResetTokenByHash(tokenHash);

    if (!tokenRecord || !tokenRecord.user.isActive) {
      throw new AppError(INVALID_RESET_TOKEN_MESSAGE, 400, undefined, "AUTH_INVALID_RESET_TOKEN");
    }

    const passwordHash = await hashPassword(input.newPassword);
    const resetResult = await authRepository.resetPasswordWithToken({
      tokenId: tokenRecord.id,
      userId: tokenRecord.userId,
      passwordHash
    });

    if (!resetResult.applied) {
      throw new AppError(INVALID_RESET_TOKEN_MESSAGE, 400, undefined, "AUTH_INVALID_RESET_TOKEN");
    }

    await authRepository.createActivityLog({
      organizationId: tokenRecord.user.organizationId,
      userId: tokenRecord.user.id,
      activityType: ActivityType.GENERIC,
      message: "Password reset completed"
    });

    return {
      message: "Password has been reset successfully"
    };
  },

  async refresh(refreshToken: string, clientInfo: ClientInfo) {
    const payload = verifyRefreshToken(refreshToken);
    const hashedToken = hashToken(refreshToken);

    const tokenRecord = await authRepository.findValidRefreshTokenByHash(hashedToken);

    if (!tokenRecord || !tokenRecord.user.isActive) {
      throw new AppError("رمز التحديث غير صالح", 401);
    }

    if (tokenRecord.userId !== payload.sub) {
      throw new AppError("رمز التحديث غير مطابق", 401);
    }

    await authRepository.markRefreshTokenUsed(tokenRecord.id);
    await authRepository.revokeRefreshToken(tokenRecord.id);

    const tokens = await issueSessionTokens(tokenRecord.user, clientInfo);

    await authRepository.createActivityLog({
      organizationId: tokenRecord.user.organizationId,
      userId: tokenRecord.user.id,
      activityType: ActivityType.REFRESH_TOKEN,
      message: "Refresh token rotated"
    });

    return {
      ...tokens,
      user: toAuthResponseUser(tokenRecord.user)
    };
  },

  async logout(refreshToken: string | null) {
    if (!refreshToken) {
      return;
    }

    let payloadUserId: number | null = null;
    let payloadOrgId: number | null = null;

    try {
      const payload = verifyRefreshToken(refreshToken);
      payloadUserId = payload.sub;
      payloadOrgId = payload.organizationId;
    } catch {
      return;
    }

    await authRepository.revokeRefreshTokenByHash(hashToken(refreshToken));

    if (payloadUserId && payloadOrgId) {
      await authRepository.createActivityLog({
        organizationId: payloadOrgId,
        userId: payloadUserId,
        activityType: ActivityType.LOGOUT,
        message: "User logged out"
      });
    }
  },

  async me(userId: number) {
    const user = await authRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new AppError("المستخدم غير موجود", 404);
    }

    return toAuthResponseUser(user);
  },

  async validateActivationToken(input: { token: string }) {
    const tokenHash = hashToken(input.token.trim());
    const user = await authRepository.findValidActivationTokenByHash(tokenHash);

    if (!user) {
      // Check if it's already active
      const existingUser = await authRepository.findUserByActivationTokenHash(tokenHash);
      if (existingUser?.accountStatus === "ACTIVE") {
        return { valid: false, alreadyActive: true };
      }
      return { valid: false };
    }

    return {
      valid: true,
      user: {
        email: user.email,
        fullName: user.fullName
      }
    };
  },

  async activateAccount(input: { token: string; newPassword: string }) {
    const tokenHash = hashToken(input.token.trim());
    const user = await authRepository.findValidActivationTokenByHash(tokenHash);

    if (!user || !user.isActive) {
      throw new AppError("رمز التفعيل غير صالح أو منتهي الصلاحية", 400, undefined, "AUTH_INVALID_ACTIVATION_TOKEN");
    }

    const passwordHash = await hashPassword(input.newPassword);
    const result = await authRepository.consumeActivationToken({
      userId: user.id,
      tokenHash,
      passwordHash
    });

    if (result.count === 0) {
      throw new AppError("رمز التفعيل غير صالح أو منتهي الصلاحية", 400, undefined, "AUTH_INVALID_ACTIVATION_TOKEN");
    }

    await authRepository.createActivityLog({
      organizationId: user.organizationId,
      userId: user.id,
      activityType: ActivityType.GENERIC,
      message: "Account activated via invitation token"
    });

    return { message: "Account activated successfully" };
  }
};
