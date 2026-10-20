import { API_ROUTES } from '~/config/api';

export interface GradeStep {
  id: number;
  name: string;
  xpRequired: number;
}

// Paliers de grades réels (gérés par l'admin), chargés une seule fois puis partagés
export function useGrades() {
  const api = useApi();
  const grades = useState<GradeStep[]>('grades:list', () => []);
  const loaded = useState<boolean>('grades:loaded', () => false);

  async function loadGrades() {
    if (loaded.value) return;
    try {
      grades.value = await api.get<GradeStep[]>(API_ROUTES.PLATFORM.GRADES, {
        showErrorToast: false,
      });
      loaded.value = true;
    } catch {
      // la progression reste masquée sans les grades
    }
  }

  // Grade atteint, grade suivant et pourcentage de progression entre les deux
  function progressFor(xp: number) {
    const sorted = [...grades.value].sort((a, b) => a.xpRequired - b.xpRequired);
    const current = [...sorted].reverse().find((grade) => xp >= grade.xpRequired) ?? null;
    const next = sorted.find((grade) => grade.xpRequired > xp) ?? null;
    const floor = current?.xpRequired ?? 0;
    const percent = next
      ? Math.min(100, Math.max(0, Math.round(((xp - floor) / (next.xpRequired - floor)) * 100)))
      : 100;
    return { current, next, percent };
  }

  return { grades, loadGrades, progressFor };
}
