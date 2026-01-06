import { defineStore } from 'pinia';
import { storage } from '~/utils/storage';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isInitialized = ref(false);
  const isLoading = ref(false);

  const isAuthenticated = computed(() => user.value !== null);
  const currentUser = computed(() => user.value);

  function setAuth(data: LoginResponse) {
    user.value = data.user;
    storage.setAccessToken(data.accessToken);
    storage.setRefreshToken(data.refreshToken);
    storage.setUser(data.user);
    if (import.meta.dev) console.log('[auth] login ok:', user.value?.email);
  }

  function setUser(userData: User) {
    user.value = userData;
    storage.setUser(userData);
    if (import.meta.dev) console.log('[auth] user updated:', userData.email);
  }

  function clearAuth() {
    user.value = null;
    storage.clearAuth();
    if (import.meta.dev) console.log('[auth] cleared');
  }

  async function initializeAuth() {
    if (isInitialized.value) return;

    isLoading.value = true;

    const storedUser = storage.getUser<User>();
    const accessToken = storage.getAccessToken();

    if (storedUser && accessToken) {
      user.value = storedUser;
      if (import.meta.dev) console.log('[auth] restored from storage:', storedUser.email);

      try {
        const api = useApi();
        const freshUser = await api.get<User>(API_ROUTES.USERS.PROFILE);
        setUser(freshUser);
        if (import.meta.dev) console.log('[auth] profile refreshed');
      } catch (error) {
        if (import.meta.dev) console.log('[auth] profile refresh failed, keeping cached user');
      }
    }

    isInitialized.value = true;
    isLoading.value = false;
    if (import.meta.dev) console.log('[auth] initialized, authenticated =', isAuthenticated.value);
  }

  return {
    user,
    isInitialized,
    isLoading,
    isAuthenticated,
    currentUser,
    setAuth,
    setUser,
    clearAuth,
    initializeAuth,
  };
});
