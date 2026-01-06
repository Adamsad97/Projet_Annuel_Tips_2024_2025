const STORAGE_KEYS = {
  ACCESS_TOKEN: 'tips_access_token',
  REFRESH_TOKEN: 'tips_refresh_token',
  USER: 'tips_user',
} as const;

export const storage = {
  getAccessToken(): string | null {
    if (import.meta.server) return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setAccessToken(token: string): void {
    if (import.meta.server) return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  getRefreshToken(): string | null {
    if (import.meta.server) return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken(token: string): void {
    if (import.meta.server) return;
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  getUser<T>(): T | null {
    if (import.meta.server) return null;
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  setUser<T>(user: T): void {
    if (import.meta.server) return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  clearAuth(): void {
    if (import.meta.server) return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};
