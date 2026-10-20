<script setup lang="ts">
import { ref } from 'vue';
import type { ApiTip, TipFormData, UserPerks } from '~/types';
import TipForm from '~/components/TipForm.vue';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

definePageMeta({
  title: 'Modifier un tip',
  middleware: 'auth',
});

useSeoMeta({ title: 'Modifier un tip' });

const route = useRoute();
const router = useRouter();
const api = useApi();
const config = useRuntimeConfig();
const { user } = useAuth();

const tipId = Number(route.params.id);
const tip = ref<ApiTip | null>(null);
const perks = ref<UserPerks | null>(null);
const existingImages = ref<string[]>([]);
const loading = ref(true);
const saving = ref(false);
const notFound = ref(false);

// Formulaire pré-rempli avec le tip existant
const initialData = computed<Partial<TipFormData>>(() => {
  if (!tip.value) return {};
  return {
    kind: tip.value.kind,
    title: tip.value.title,
    // Champ "Introduction" du formulaire (non stocké séparément) : début du contenu
    description: (tip.value.content ?? '').slice(0, 200),
    content: tip.value.content ?? '',
    tags: tip.value.categories?.map((c) => c.category.name) ?? [],
    address: tip.value.address ?? '',
    lat: tip.value.latitude ?? undefined,
    lng: tip.value.longitude ?? undefined,
  };
});

onMounted(async () => {
  try {
    const [loadedTip, loadedPerks] = await Promise.all([
      api.get<ApiTip>(API_ROUTES.TIPS.DETAIL(tipId), { showErrorToast: false }),
      api.get<UserPerks>(API_ROUTES.USERS.PERKS, { showErrorToast: false }),
    ]);
    // Seul l'auteur peut modifier son tip
    if (loadedTip.userId !== user.value?.id) {
      notFound.value = true;
      return;
    }
    tip.value = loadedTip;
    perks.value = loadedPerks;
    existingImages.value = [...(loadedTip.images ?? [])];
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
});

const removeImage = (image: string) => {
  existingImages.value = existingImages.value.filter((current) => current !== image);
};

const handleUpdate = async (data: TipFormData) => {
  saving.value = true;
  try {
    let images = [...existingImages.value];
    if (data.images.length > 0) {
      const formData = new FormData();
      data.images.forEach((image) => formData.append('images', image));
      const uploaded = await api.post<string[]>(API_ROUTES.UPLOADS.TIP_IMAGES, formData);
      images = [...images, ...uploaded];
    }

    const body: Record<string, unknown> = {
      title: data.title,
      content: data.content,
      categories: data.tags,
      address: data.address || undefined,
      images,
    };
    if (data.lat !== undefined && data.lng !== undefined) {
      body.latitude = data.lat;
      body.longitude = data.lng;
    }

    await api.patch(API_ROUTES.TIPS.UPDATE(tipId), body, {
      showSuccessToast: true,
      successMessage:
        tip.value?.status === 'PENDING'
          ? 'Modifications enregistrées'
          : 'Modifications enregistrées : le tip repasse en validation',
    });
    await router.push('/my-tips');
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="max-w-3xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-black text-slate-800 dark:text-white mb-2">Modifier le tip</h1>
    <p
      v-if="tip && tip.status !== 'PENDING'"
      class="mb-6 text-sm text-amber-600 flex items-center gap-2"
    >
      <Icon name="tabler:info-circle" class="w-4 h-4" />
      Une fois modifié, le tip repasse en validation par un modérateur avant d'être de nouveau
      visible.
    </p>

    <p v-if="loading" class="text-slate-400">Chargement…</p>

    <div v-else-if="notFound" class="text-center py-16 space-y-3">
      <p class="text-slate-600 dark:text-slate-300">
        Ce tip est introuvable ou ne vous appartient pas.
      </p>
      <NuxtLink to="/my-tips" class="text-purple-600 font-bold hover:underline">
        Retour à mes tips
      </NuxtLink>
    </div>

    <div
      v-else-if="tip"
      class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6"
    >
      <!-- Images déjà publiées -->
      <div v-if="existingImages.length > 0" class="space-y-2">
        <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Images actuelles</p>
        <div class="flex flex-wrap gap-3">
          <div v-for="image in existingImages" :key="image" class="relative">
            <img
              :src="resolveUploadUrl(image, config.public.apiBaseUrl)"
              alt=""
              class="w-24 h-24 object-cover rounded-xl"
            />
            <button
              type="button"
              class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
              aria-label="Retirer cette image"
              @click="removeImage(image)"
            >
              <Icon name="tabler:x" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <TipForm
        :loading="saving"
        :perks="perks"
        :initial-data="initialData"
        :existing-images-count="existingImages.length"
        editing
        @submit="handleUpdate"
      />

      <NuxtLink :to="ROUTES.TIP_DETAIL(tipId)" class="block text-sm text-slate-500 hover:underline">
        Voir le tip
      </NuxtLink>
    </div>
  </div>
</template>
