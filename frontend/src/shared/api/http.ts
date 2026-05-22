import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig
} from "axios";
import { hasRefreshSession } from "../../features/auth/session";
import { useAuthStore } from "../../features/auth/auth.store";
import type { AuthSessionResponse } from "../../features/auth/types";
import type { ApiResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 15000,
  headers: {
    "x-platform": "web"
  }
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  // [FIX] إضافة CSRF header مطلوب من Backend على مسار /auth/refresh.
  // هذا الـ header يثبت أن الطلب برمجي (XHR/fetch) وليس من form أو img tag
  // مما يمنع هجمات CSRF الكلاسيكية التي تستغل الـ HttpOnly Cookie.
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "x-platform": "web"
  }
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
};

let refreshPromise: Promise<string | null> | null = null;

const isAuthRoute = (url?: string): boolean => {
  if (!url) {
    return false;
  }

  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
};

const attachAuthHeader = (
  config: InternalAxiosRequestConfig,
  token: string
): InternalAxiosRequestConfig => {
  const headers = AxiosHeaders.from(config.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;

  return config;
};

const requestRefreshToken = async (): Promise<string | null> => {
  if (!hasRefreshSession()) {
    return null;
  }

  try {
    const response = await refreshClient.post<ApiResponse<AuthSessionResponse>>(
      "/auth/refresh",
      {}
    );

    const session = response.data.data;
    useAuthStore.getState().setSession(session);
    return session.accessToken;
  } catch {
    useAuthStore.getState().clearAuth();
    return null;
  }
};

export const ensureFreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = requestRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use((config) => {
  config.withCredentials = isAuthRoute(config.url);

  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    return config;
  }

  return attachAuthHeader(config, accessToken);
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (status !== 401 || !originalRequest) {
      throw error;
    }

    if (isAuthRoute(originalRequest.url)) {
      throw error;
    }

    if ((originalRequest._retryCount ?? 0) >= 1) {
      useAuthStore.getState().clearAuth();
      throw error;
    }

    originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;

    const refreshedAccessToken = await ensureFreshAccessToken();

    if (!refreshedAccessToken) {
      useAuthStore.getState().clearAuth();
      throw error;
    }

    attachAuthHeader(originalRequest, refreshedAccessToken);
    try {
      return await apiClient(originalRequest);
    } catch (retryError) {
      if (axios.isAxiosError(retryError) && retryError.response?.status === 401) {
        useAuthStore.getState().clearAuth();
      }
      throw retryError;
    }
  }
);
