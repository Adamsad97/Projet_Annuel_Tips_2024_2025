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

  function apiError(err: unknown, defaultTitle = 'erreur'): void {
    if (!toast.value) {
      console.warn('[toast] Toast non initialisé - apiError:', err);
      return;
    }

    let message = 'unexpected error';

    if (err && typeof err === 'object') {
      const apiErr = err as ApiErrorResponse;

      if (apiErr.details && Array.isArray(apiErr.details) && apiErr.details.length > 0) {
        message = apiErr.details.map((e) => `${e.path ? e.path + ': ' : ''}${e.message}`).join(', ');
      }
      else if (apiErr.errors && Array.isArray(apiErr.errors) && apiErr.errors.length > 0) {
        message = apiErr.errors.map((e) => e.message).join(', ');
      }
      else if (apiErr.message) {
        message = apiErr.message;
      }
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
