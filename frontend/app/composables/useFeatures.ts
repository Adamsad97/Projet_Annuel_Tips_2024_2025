import { API_ROUTES } from '~/config/api';

// Fonctionnalités expérimentales actives pour l'utilisateur courant (tests A/B).
// Tant que la liste n'est pas chargée, tout est considéré comme actif (valeur par défaut du backend).
export function useFeatures() {
  const api = useApi();
  const features = useState<Record<string, boolean>>('features:enabled', () => ({}));

  async function loadFeatures() {
    try {
      features.value = await api.get<Record<string, boolean>>(API_ROUTES.PLATFORM.FEATURES, {
        showErrorToast: false,
      });
    } catch {
      // en cas d'échec on garde l'état actuel
    }
  }

  const isEnabled = (key: string): boolean => features.value[key] ?? true;

  return { features, loadFeatures, isEnabled };
}
