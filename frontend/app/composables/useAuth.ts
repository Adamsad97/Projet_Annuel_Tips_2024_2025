import type { FetchError } from 'ofetch';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  LoginResponse,
  LoginResult,
  RegisterResult,
  TwoFactorChallenge,
} from '~/types/auth';
import { useAuthStore } from '~/stores/auth';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

export function useAuth() {
  const authStore = useAuthStore();
  const api = useApi();
  const router = useRouter();
  const toast = useToastMessage();
  const push = usePushNotifications();

  // Jeton temporaire reçu quand le compte a la 2FA (mot de passe validé, code attendu)
  const twoFactorToken = useState<string | null>('auth:two-factor-token', () => null);

  function openSession(response: LoginResponse) {
    authStore.setAuth(response);
    twoFactorToken.value = null;

    const displayName =
      response.user.firstname || response.user.lastname
        ? `${response.user.firstname || ''} ${response.user.lastname || ''}`.trim()
        : response.user.email;
    toast.success(`Bienvenue ${displayName}`, 'Connexion réussie');
  }

  async function login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const response = await api.post<LoginResponse | TwoFactorChallenge>(
        API_ROUTES.USERS.LOGIN,
        credentials,
        { skipAuth: true, showErrorToast: false },
      );

      if ('twoFactorRequired' in response) {
        twoFactorToken.value = response.twoFactorToken;
        return 'two-factor';
      }

      openSession(response);
      return 'success';
    } catch (error) {
      if (import.meta.dev) {
        console.error('[auth] login error:', error);
      }
      // Pas de toast d'erreur : la page de connexion propose de renvoyer l'email
      const fetchError = error as FetchError<{ message?: string }>;
      if (fetchError.statusCode === 403 && fetchError.data?.message === 'email not verified') {
        return 'email-not-verified';
      }
      toast.apiError(fetchError);
      return 'error';
    }
  }

  // Lien reçu par email (page /auth/verify-email)
  async function verifyEmail(token: string): Promise<boolean> {
    try {
      await api.post(
        API_ROUTES.AUTH.VERIFY_EMAIL,
        { token },
        { skipAuth: true, showErrorToast: false },
      );
      return true;
    } catch {
      return false;
    }
  }

  // L'API répond pareil que le compte existe ou non : le message reste volontairement neutre
  async function resendVerificationEmail(email: string): Promise<boolean> {
    try {
      await api.post(API_ROUTES.AUTH.RESEND_VERIFICATION, { email }, { skipAuth: true });
      toast.success(
        'Si ce compte existe et n’est pas encore activé, un nouvel email vient d’être envoyé.',
        'Email envoyé',
      );
      return true;
    } catch {
      return false;
    }
  }

  // Deuxième étape du login : code de l'application d'authentification ou code de secours
  async function verifyTwoFactor(code: string): Promise<boolean> {
    if (!twoFactorToken.value) return false;

    try {
      const response = await api.post<LoginResponse>(
        API_ROUTES.USERS.LOGIN_2FA,
        { twoFactorToken: twoFactorToken.value, code },
        { skipAuth: true },
      );
      openSession(response);
      return true;
    } catch (error) {
      if (import.meta.dev) {
        console.error('[auth] two-factor error:', error);
      }
      return false;
    }
  }

  function cancelTwoFactor() {
    twoFactorToken.value = null;
  }

  async function register(credentials: RegisterCredentials): Promise<RegisterResult> {
    try {
      const created = await api.post<User & { emailVerificationRequired?: boolean }>(
        API_ROUTES.USERS.REGISTER,
        credentials,
        { skipAuth: true },
      );

      // Compte à activer : la page d'inscription affiche « vérifiez votre boîte mail »
      if (created.emailVerificationRequired) {
        return 'verify-email';
      }

      toast.success('Inscription réussie ! Connexion en cours...', 'Bienvenue');

      // Un compte qui vient d'être créé n'a pas encore de 2FA
      const result = await login({ email: credentials.email, password: credentials.password });
      return result === 'success' ? 'success' : 'error';
    } catch (error) {
      if (import.meta.dev) {
        console.error('[auth] register error:', error);
      }
      return 'error';
    }
  }

  async function logout(): Promise<void> {
    try {
      if (authStore.isAuthenticated) {
        // Avant la déconnexion (la requête doit être authentifiée) : ce navigateur
        // ne doit plus recevoir les notifications de ce compte
        await push.disable().catch(() => undefined);
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
    verifyTwoFactor,
    cancelTwoFactor,
    register,
    verifyEmail,
    resendVerificationEmail,
    logout,
    getProfile,
  };
}
