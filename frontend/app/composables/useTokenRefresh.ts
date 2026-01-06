import type { ApiResponse, RefreshTokenResponse } from '~/types/api';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';
import { storage } from '~/utils/storage';

export function useTokenRefresh() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  async function refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        authStore.clearAuth();
        await navigateTo(ROUTES.LOGIN);
        return false;
      }

      const response = await $fetch<ApiResponse<RefreshTokenResponse>>(
        `${config.public.apiBaseUrl}${API_ROUTES.AUTH.REFRESH}`,
        {
          method: 'POST',
          body: { refreshToken },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.success && response.data) {
        storage.setAccessToken(response.data.accessToken);
        storage.setRefreshToken(response.data.refreshToken);
        if (import.meta.dev) {
          console.log('[refresh] token refreshed');
        }
        return true;
      }

      authStore.clearAuth();
      await navigateTo(ROUTES.LOGIN);
      return false;
    } catch (error) {
      if (import.meta.dev) {
        console.error('[refresh] error:', error);
      }

      authStore.clearAuth();
      await navigateTo(ROUTES.LOGIN);
      return false;
    }
  }

  return {
    refreshAccessToken,
  };
}
