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
  const { ar, fallback, includeRequestId = true } = options;
  const normalized = normalizeApiError(error, fallback);
  let message = normalized.message?.trim() || fallback;

  if (axios.isAxiosError<ApiErrorResponse>(error) && !error.response) {
    message = localizedTransportFallback(ar);
  } else if (looksTechnical(message)) {
    message = localizedStatusFallback(normalized.status, ar, fallback);
  } else {
    message = localizedStatusFallback(normalized.status, ar, message);
  }

  if (includeRequestId && normalized.requestId) {
    const requestIdLabel = ar ? "رقم الطلب" : "Request ID";
    return `${message} (${requestIdLabel}: ${normalized.requestId})`;
  }

  return message;
};
