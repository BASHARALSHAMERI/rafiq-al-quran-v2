import axios from "axios";
import type { ApiErrorResponse } from "./types";

export type NormalizedApiError = {
  message: string;
  code?: string;
  status?: number;
  requestId?: string;
  details?: unknown;
};

export const normalizeApiError = (
  error: unknown,
  fallback = "Request failed"
): NormalizedApiError => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const payload = error.response?.data;
    const normalizedMessage =
      payload?.error?.message ?? payload?.message ?? error.message ?? fallback;

    return {
      message: normalizedMessage,
      code: payload?.error?.code,
      status: error.response?.status,
      requestId: payload?.error?.requestId,
      details: payload?.error?.details ?? payload?.details
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      message: error.message
    };
  }

  return {
    message: fallback
  };
};

const TECHNICAL_MESSAGE_PATTERNS = [
  /network error/i,
  /failed to fetch/i,
  /load failed/i,
  /timeout/i,
  /request failed with status code/i,
  /unexpected token/i,
  /internal server error/i
];

const looksTechnical = (message: string) =>
  TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));

const localizedTransportFallback = (ar: boolean) =>
  ar
    ? "تعذر إتمام العملية. تحقق من الاتصال ثم أعد المحاولة."
    : "Unable to complete the request. Check your connection and try again.";

const localizedStatusFallback = (status: number | undefined, ar: boolean, fallback: string) => {
  if (status === 401) {
    return ar ? "انتهت الجلسة. سجّل الدخول مرة أخرى." : "Your session has expired. Sign in again.";
  }

  if (status === 403) {
    return ar ? "ليست لديك صلاحية لتنفيذ هذه العملية." : "You do not have permission to perform this action.";
  }

  if (status === 404) {
    if (fallback && !looksTechnical(fallback) && fallback !== "Request failed") {
      return fallback;
    }
    return ar ? "لم يتم العثور على البيانات المطلوبة." : "The requested data could not be found.";
  }

  if (status === 422) {
    return fallback;
  }

  if (status && status >= 500) {
    return ar ? "تعذر إتمام العملية حاليًا. يرجى المحاولة مرة أخرى." : "Unable to complete the request right now. Please try again.";
  }

  return fallback;
};

const AR_TO_EN_MAP: Record<string, string> = {
  // Zod validation messages
  "حقل واحد على الأقل مطلوب": "At least one field is required",
  "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل": "Password must be at least 8 characters",
  "يجب أن تحتوي كلمة المرور على حرف واحد على الأقل": "Must contain at least one letter",
  "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل": "Must contain at least one number",
  "حقل البريد الإلكتروني أو رقم الهاتف مطلوب": "identifier is required",
  "الاسم بالعربية مطلوب": "nameAr is required",
  "الجنس مطلوب": "gender is required",
  "المعلم الأساسي مطلوب": "primaryTeacherUserId is required",
  "نوع الحلقة مطلوب": "circleType is required",

  // Error middleware
  "بيانات الطلب غير صحيحة. يرجى مراجعة الحقول المطلوبة.": "The request data is invalid. Please check the required fields.",
  "حجم البيانات المرسلة كبير جداً. يرجى تقليل حجم الملف.": "The uploaded data is too large. Please reduce the file size.",
  "صيغة البيانات المرسلة غير صحيحة.": "The request data format is invalid.",
  "تعذر إتمام العملية. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.": "Unable to complete the request. Please try again or contact support.",
  "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.": "Too many requests. Please try again later.",

  // Auth
  "بيانات الدخول غير صحيحة": "Invalid login credentials",
  "نسخة الويب مخصّصة للمدير العام ومدير المركز فقط": "Web access is restricted to administrators only",
  "نسخة الجوال مخصّصة للمعلمين والمشرفين والطلاب وأولياء الأمور فقط": "Mobile access is restricted to teachers, supervisors, students, and parents",
  "الحساب يتطلب إنشاء كلمة مرور": "Account requires password setup",
  "المُعرّف غير صالح": "Invalid identifier",
  "المستخدم غير موجود أو غير نشط": "User not found or inactive",
  "الحساب لديه كلمة مرور بالفعل": "Account already has a password",
  "رمز إعادة التعيين غير صالح أو منتهي الصلاحية": "Invalid or expired reset token",
  "رمز التحديث غير صالح": "Invalid refresh token",
  "رمز التحديث غير مطابق": "Refresh token mismatch",
  "المستخدم غير موجود": "User not found",
  "رمز التفعيل غير صالح أو منتهي الصلاحية": "Invalid or expired activation token",

  // Users
  "البريد الإلكتروني مستخدم مسبقاً": "Email is already in use",
  "اسم المستخدم مستخدم مسبقاً": "Username is already in use",
  "رقم الهاتف مستخدم مسبقاً": "Phone number is already in use",
  "رقم الهوية مستخدم مسبقاً": "National ID is already in use",
  "المركز غير موجود": "Center not found",
  "الحلقة غير موجودة": "Circle not found",

  // Organization
  "المنظمة غير موجودة": "Organization not found",

  // Generic
  "ليس لديك صلاحية": "Access denied",
  "غير مصرح بهذه العملية": "Forbidden",
};

const translateArToEn = (message: string): string => {
  return AR_TO_EN_MAP[message] ?? message;
};

export const getApiErrorRequestId = (error: unknown): string | null => {
  const requestId = normalizeApiError(error).requestId;
  return requestId && requestId.trim() ? requestId : null;
};

export const getApiErrorMessage = (error: unknown, fallback = "Request failed"): string => {
  const normalized = normalizeApiError(error, fallback);

  if (normalized.requestId) {
    return `${normalized.message} (Request ID: ${normalized.requestId})`;
  }

  return normalized.message;
};

export const getLocalizedApiErrorMessage = (
  error: unknown,
  options: {
    ar: boolean;
    fallback: string;
    includeRequestId?: boolean;
  }
): string => {
  const { ar, fallback, includeRequestId = false } = options;
  const normalized = normalizeApiError(error, fallback);
  let message = normalized.message?.trim() || fallback;

  if (axios.isAxiosError<ApiErrorResponse>(error) && !error.response) {
    message = localizedTransportFallback(ar);
  } else if (looksTechnical(message)) {
    message = localizedStatusFallback(normalized.status, ar, fallback);
  } else {
    message = localizedStatusFallback(normalized.status, ar, message);
  }

  if (!ar) {
    message = translateArToEn(message);
  }

  if (includeRequestId && normalized.requestId) {
    const requestIdLabel = ar ? "رقم الطلب" : "Request ID";
    return `${message} (${requestIdLabel}: ${normalized.requestId})`;
  }

  return message;
};
