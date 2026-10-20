import type { Category } from '~/types';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

// Catégories et état de suivi, partagés entre la liste des tips et les paramètres
export function useCategoryFollow() {
  const api = useApi();
  const toast = useToastMessage();
  const route = useRoute();
  const { isAuthenticated } = useAuth();
  const categories = useState<Category[]>('categories:list', () => []);

  async function loadCategories() {
    try {
      categories.value = await api.get<Category[]>(API_ROUTES.CATEGORIES.LIST, {
        showErrorToast: false,
      });
    } catch {
      categories.value = [];
    }
  }

  const findByName = (name: string) =>
    categories.value.find((category) => category.name.toLowerCase() === name.toLowerCase());

  async function toggleFollow(category: Category) {
    if (!isAuthenticated.value) {
      await navigateTo({ path: ROUTES.LOGIN, query: { redirect: route.fullPath } });
      return;
    }

    const follow = !category.isFollowed;
    try {
      if (follow) {
        await api.post(API_ROUTES.CATEGORIES.FOLLOW(category.id));
      } else {
        await api.delete(API_ROUTES.CATEGORIES.FOLLOW(category.id));
      }
      category.isFollowed = follow;
      toast.success(
        follow
          ? `Vous serez notifié des nouveaux tips dans ${category.name}`
          : `Vous ne suivez plus ${category.name}`,
      );
    } catch {
      // l'erreur est déjà affichée par useApi
    }
  }

  return { categories, loadCategories, findByName, toggleFollow };
}
