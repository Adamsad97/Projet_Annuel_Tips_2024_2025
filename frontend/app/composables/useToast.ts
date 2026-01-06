export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
}

interface ToastInstance {
  addToast: (toast: ToastMessage) => void;
}

interface ApiErrorDetail {
  path: string;
  message: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ message: string; path?: string[] }>;
  details?: ApiErrorDetail[];
  status?: number;
}

export function useToastMessage() {
  const toast = useState<ToastInstance | null>('toast-instance', () => null);

  function success(message: string, title?: string): void {
    if (!toast.value) {
      console.warn('[toast] Toast non initialisé - success:', message);
      return;
    }
    toast.value.addToast({ type: 'success', message, title });
  }

  function error(message: string, title?: string): void {
    if (!toast.value) {
      console.warn('[toast] Toast non initialisé - error:', message);
      return;
    }
    toast.value.addToast({ type: 'error', message, title });
  }

  function warning(message: string, title?: string): void {
    if (!toast.value) {
      console.warn('[toast] Toast non initialisé - warning:', message);
      return;
    }
    toast.value.addToast({ type: 'warning', message, title });
  }

  function info(message: string, title?: string): void {
    if (!toast.value) {
      console.warn('[toast] Toast non initialisé - info:', message);
      return;
    }
    toast.value.addToast({ type: 'info', message, title });
  }

  /**
   * Affiche une erreur à partir d'une réponse API ou d'une erreur inconnue
   * Gère automatiquement les différents formats d'erreur backend
   */
  function apiError(err: unknown, defaultTitle = 'Erreur'): void {
    if (!toast.value) {
      console.warn('[toast] Toast non initialisé - apiError:', err);
      return;
    }

    let message = 'Une erreur inattendue est survenue';

    if (err && typeof err === 'object') {
      const apiErr = err as ApiErrorResponse;

      // Format 1: Erreur avec tableau details (backend format)
      if (apiErr.details && Array.isArray(apiErr.details) && apiErr.details.length > 0) {
        message = apiErr.details.map((e) => `${e.path ? e.path + ': ' : ''}${e.message}`).join(', ');
      }
      // Format 2: Erreur avec tableau errors (Zod format)
      else if (apiErr.errors && Array.isArray(apiErr.errors) && apiErr.errors.length > 0) {
        message = apiErr.errors.map((e) => e.message).join(', ');
      }
      // Format 3: Message direct
      else if (apiErr.message) {
        message = apiErr.message;
      }
      // Format 4: Propriété error
      else if (apiErr.error) {
        message = apiErr.error;
      }
    }

    toast.value.addToast({ type: 'error', message, title: defaultTitle });
  }

  return {
    success,
    error,
    warning,
    info,
    apiError,
  };
}
