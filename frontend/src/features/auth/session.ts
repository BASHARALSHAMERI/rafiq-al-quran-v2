const REFRESH_SESSION_STORAGE_KEY = "rafiq_v2_refresh_session";
const REFRESH_TOKEN_STORAGE_KEY = "rafiq_v2_refresh_token";

const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
};

export const hasRefreshSession = (): boolean => {
  const storage = getSessionStorage();
  if (!storage) {
    return false;
  }

  return (
    storage.getItem(REFRESH_SESSION_STORAGE_KEY) === "1" ||
    Boolean(storage.getItem(REFRESH_TOKEN_STORAGE_KEY))
  );
};

export const getStoredRefreshToken = (): string | null => {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  return storage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};

export const setRefreshSessionAvailable = (
  available: boolean,
  refreshToken?: string | null
): void => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  if (available) {
    storage.setItem(REFRESH_SESSION_STORAGE_KEY, "1");
    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }
    return;
  }

  storage.removeItem(REFRESH_SESSION_STORAGE_KEY);
  storage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

export const clearAuthSession = (): void => {
  setRefreshSessionAvailable(false);
};
