import type { User, LoginCredentials, RegisterCredentials, LoginResponse } from '~/types/auth';
import { useAuthStore } from '~/stores/auth';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

export function useAuth() {
  const authStore = useAuthStore();
  const api = useApi();
  const router = useRouter();
  const toast = useToastMessage();

  async function login(credentials: LoginCredentials): Promise<boolean> {
    try {
      const response = await api.post<LoginResponse>(API_ROUTES.USERS.LOGIN, credentials, {
        skipAuth: true,
      });

      authStore.setAuth(response);
      const displayName = response.user.firstname || response.user.lastname
        ? `${response.user.firstname || ''} ${response.user.lastname || ''}`.trim()
        : response.user.email;
      toast.success(`Bienvenue ${displayName}`, 'Connexion réussie');

      if (import.meta.dev) {
        console.log('[auth] login ok:', response.user.email);
      }

      return true;
    } catch (error) {
      if (import.meta.dev) {
        console.error('[auth] login error:', error);
      }
      return false;
    }
  }

  async function register(credentials: RegisterCredentials): Promise<boolean> {
    try {
      await api.post<User>(API_ROUTES.USERS.REGISTER, credentials, { skipAuth: true });

      toast.success('Inscription réussie ! Connexion en cours...', 'Bienvenue');

      if (import.meta.dev) {
        console.log('[auth] register ok, auto-login');
      }

      return await login({
        email: credentials.email,
        password: credentials.password,
      });
    } catch (error) {
      if (import.meta.dev) {
        console.error('[auth] register error:', error);
      }
      return false;
    }
  }

  async function logout(): Promise<void> {
    try {
      if (authStore.isAuthenticated) {
        await api.post(API_ROUTES.AUTH.LOGOUT);
      }

      if (import.meta.dev) {
        console.log('[auth] logout ok');
      }
    } catch (error) {
      if (import.meta.dev) {
        console.error('[auth] logout error:', error);
      }
    } finally {
      authStore.clearAuth();
      toast.info('À bientôt !', 'Déconnexion');
      await router.push(ROUTES.LOGIN);
    }
  }

  async function getProfile(): Promise<User | null> {
    try {
      const user = await api.get<User>(API_ROUTES.USERS.PROFILE);
      authStore.setUser(user);

      if (import.meta.dev) {
        console.log('[auth] profile loaded:', user.email);
      }

      return user;
    } catch (error) {
      if (import.meta.dev) {
        console.error('[auth] profile error:', error);
      }
      return null;
    }
  }

  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed(() => authStore.currentUser);

  return {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    getProfile,
  };
}
