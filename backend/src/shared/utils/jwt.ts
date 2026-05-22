import { Role } from "@prisma/client";
// [FIX] استيراد أنواع أخطاء JWT المحددة لتمييزها بدقة
import jwt, {
  type JwtPayload,
  type SignOptions,
  TokenExpiredError,
  JsonWebTokenError
} from "jsonwebtoken";
import { randomUUID } from "crypto";
import { env } from "../../config/env";
import { AppError } from "../errors/app-error";
import type { JwtAuthPayload } from "../types/auth.types";

type UserTokenClaims = {
  userId: number;
  role: Role;
  organizationId: number;
};

const asJwtPayload = (value: string | JwtPayload): JwtPayload => {
  if (typeof value === "string") {
    throw new AppError("Invalid JWT payload type", 401, undefined, "TOKEN_INVALID");
  }
  return value;
};

const sign = (
  payload: JwtAuthPayload,
  secret: string,
  expiresIn: string
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, secret, options);
};

const normalizeVerifiedPayload = (payload: JwtPayload): JwtAuthPayload => {
  if (
    typeof payload.sub !== "number" ||
    typeof payload.organizationId !== "number" ||
    typeof payload.role !== "string" ||
    (payload.type !== "access" && payload.type !== "refresh")
  ) {
    throw new AppError("Invalid token payload structure", 401, undefined, "TOKEN_INVALID");
  }

  return {
    sub: payload.sub,
    organizationId: payload.organizationId,
    role: payload.role as Role,
    type: payload.type,
    jti: typeof payload.jti === "string" ? payload.jti : undefined,
    iat: payload.iat,
    exp: payload.exp
  };
};

export const signAccessToken = (claims: UserTokenClaims): string => {
  const payload: JwtAuthPayload = {
    sub: claims.userId,
    role: claims.role,
    organizationId: claims.organizationId,
    type: "access"
  };

  return sign(payload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
};

export const signRefreshToken = (claims: UserTokenClaims): string => {
  const payload: JwtAuthPayload = {
    sub: claims.userId,
    role: claims.role,
    organizationId: claims.organizationId,
    type: "refresh",
    jti: randomUUID()
  };

  return sign(payload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);
};

// [FIX] إعادة كتابة verifyAccessToken مع تمييز دقيق بين أنواع الأخطاء
export const verifyAccessToken = (token: string): JwtAuthPayload => {
  try {
    const rawPayload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const payload = normalizeVerifiedPayload(asJwtPayload(rawPayload));

    if (payload.type !== "access") {
      // [FIX] استخدام refresh token كـ access token — محاولة اختراق
      throw new AppError("Token is not an access token", 401, undefined, "TOKEN_TYPE_MISMATCH");
    }

    return payload;
  } catch (err) {
    // [FIX] لا نبتلع AppError — نُعيد رميها كما هي
    if (err instanceof AppError) throw err;

    // [FIX] انتهاء الصلاحية — Frontend يجب أن يُنفّذ refresh تلقائياً
    if (err instanceof TokenExpiredError) {
      throw new AppError(
        "Access token expired",
        401,
        { expiredAt: err.expiredAt },
        "TOKEN_EXPIRED"
      );
    }

    // [FIX] توكن مزوّر أو محرَّف — يلزم logout فوري
    if (err instanceof JsonWebTokenError) {
      throw new AppError(
        "Invalid access token",
        401,
        undefined,
        "TOKEN_INVALID"
      );
    }

    // [FIX] أي خطأ غير متوقع
    throw new AppError(
      "Token verification failed",
      401,
      undefined,
      "TOKEN_VERIFY_FAILED"
    );
  }
};

// [FIX] إعادة كتابة verifyRefreshToken بنفس نمط التمييز الدقيق
export const verifyRefreshToken = (token: string): JwtAuthPayload => {
  try {
    const rawPayload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const payload = normalizeVerifiedPayload(asJwtPayload(rawPayload));

    if (payload.type !== "refresh") {
      // [FIX] استخدام access token كـ refresh token — محاولة اختراق
      throw new AppError("Token is not a refresh token", 401, undefined, "TOKEN_TYPE_MISMATCH");
    }

    return payload;
  } catch (err) {
    // [FIX] لا نبتلع AppError — نُعيد رميها كما هي
    if (err instanceof AppError) throw err;

    // [FIX] انتهاء صلاحية الـ refresh — يلزم إعادة تسجيل الدخول
    if (err instanceof TokenExpiredError) {
      throw new AppError(
        "Refresh token expired",
        401,
        { expiredAt: err.expiredAt },
        "REFRESH_TOKEN_EXPIRED"
      );
    }

    // [FIX] refresh token مزوّر — logout فوري
    if (err instanceof JsonWebTokenError) {
      throw new AppError(
        "Invalid refresh token",
        401,
        undefined,
        "REFRESH_TOKEN_INVALID"
      );
    }

    throw new AppError(
      "Refresh token verification failed",
      401,
      undefined,
      "REFRESH_TOKEN_VERIFY_FAILED"
    );
  }
};

export const getTokenExpiryDate = (token: string): Date => {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === "string" || typeof decoded.exp !== "number") {
    throw new AppError("Unable to resolve token expiry", 500);
  }

  return new Date(decoded.exp * 1000);
};