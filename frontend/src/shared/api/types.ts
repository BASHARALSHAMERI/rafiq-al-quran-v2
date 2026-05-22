export type ApiResponse<T> = {
  ok: boolean;
  data: T;
  message?: string;
  details?: unknown;
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
};

export type ApiErrorResponse = {
  ok: false;
  message?: string;
  error?: ApiErrorPayload;
  details?: unknown;
};
