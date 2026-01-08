import type { FetchError } from 'ofetch';
import type { ApiResponse } from '~/types/api';
import { storage } from '~/utils/storage';
import { useAuthStore } from '~/stores/auth';
import { API_ROUTES } from '~/config/api';

interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  retry?: boolean;
  skipAuth?: boolean;
  showErrorToast?: boolean; // Afficher automatiquement les erreurs en toast (défaut: true)
  showSuccessToast?: boolean; // Afficher automatiquement les succès en toast (défaut: false)
  successMessage?: string; // Message de succès personnalisé
}

export function useApi() {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const toast = useToastMessage();
  const { refreshAccessToken } = useTokenRefresh();

  async function apiCall<T>(endpoint: string, options: ApiCallOptions = {}): Promise<T> {
    const baseURL = config.public.apiBaseUrl;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (!options.skipAuth && import.meta.client) {
      const token = storage.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    if (import.meta.dev) {
      console.log(`[api] ${options.method || 'GET'} ${endpoint}`);
    }

    try {
      const response = await $fetch<ApiResponse<T>>(endpoint, {
        baseURL,
        method: options.method || 'GET',
        body: options.body as BodyInit | Record<string, unknown> | null | undefined,
        headers,
      });

      if (import.meta.dev) {
        console.log('[api] response:', { success: response.success, hasData: response.data !== undefined, message: response.message });
      }

      if (response.success && response.data !== undefined) {
        if (options.showSuccessToast && options.successMessage) {
          toast.success(options.successMessage);
        }
        return response.data;
      }

      if (response.success) {
        if (options.showSuccessToast && options.successMessage) {
          toast.success(options.successMessage);
        }
        return response as unknown as T;
      }

      console.warn('[api] Server returned success=false:', response);
      throw new Error(response.message || 'erreur serveur');
    } catch (error) {
      const fetchError = error as FetchError;

      if (fetchError.statusCode === 401 && !options.retry && !options.skipAuth) {
        if (endpoint !== API_ROUTES.AUTH.REFRESH) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            return apiCall<T>(endpoint, { ...options, retry: true });
          } else {
            authStore.clearAuth();
          }
        }
      }

      if (options.showErrorToast !== false) {
        toast.apiError(fetchError);
      }

      if (import.meta.dev) {
        const errorMessage = fetchError.data?.message || fetchError.message || 'erreur serveur';
        console.error('[api] error:', errorMessage, fetchError);
      }

      throw fetchError;
    }
  }

  return {
    get: <T>(endpoint: string, options?: Omit<ApiCallOptions, 'method' | 'body'>) =>
      apiCall<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(
      endpoint: string,
      body?: unknown,
      options?: Omit<ApiCallOptions, 'method' | 'body'>,
    ) => apiCall<T>(endpoint, { ...options, method: 'POST', body }),

    put: <T>(endpoint: string, body?: unknown, options?: Omit<ApiCallOptions, 'method' | 'body'>) =>
      apiCall<T>(endpoint, { ...options, method: 'PUT', body }),

    delete: <T>(endpoint: string, options?: Omit<ApiCallOptions, 'method' | 'body'>) =>
      apiCall<T>(endpoint, { ...options, method: 'DELETE' }),

    patch: <T>(
      endpoint: string,
      body?: unknown,
      options?: Omit<ApiCallOptions, 'method' | 'body'>,
    ) => apiCall<T>(endpoint, { ...options, method: 'PATCH', body }),
  };
}
