const REFRESH_SESSION_STORAGE_KEY = "rafiq_v2_refresh_session";

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

  return storage.getItem(REFRESH_SESSION_STORAGE_KEY) === "1";
};

export const setRefreshSessionAvailable = (available: boolean): void => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  if (available) {
    storage.setItem(REFRESH_SESSION_STORAGE_KEY, "1");
    return;
  }

  storage.removeItem(REFRESH_SESSION_STORAGE_KEY);
};

export const clearAuthSession = (): void => {
  setRefreshSessionAvailable(false);
};
