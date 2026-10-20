<script setup lang="ts">
import { ref } from 'vue';
import type { TipFormData, UserPerks } from '~/types/tip';
import TipForm from '~/components/TipForm.vue';
import { API_ROUTES } from '~/config/api';

definePageMeta({
  title: 'Créer un Tip',
  middleware: 'auth',
});

const loading = ref(false);
const toast = useToastMessage();
const router = useRouter();
const api = useApi();

// Avantages du grade (quota, longueur, images, localisation) affichés dans le formulaire
const perks = ref<UserPerks | null>(null);
const perksLoaded = ref(false);
onMounted(async () => {
  try {
    perks.value = await api.get<UserPerks>(API_ROUTES.USERS.PERKS, { showErrorToast: false });
  } catch {
    perks.value = null;
  } finally {
    perksLoaded.value = true;
  }
});

const handleCreateTip = async (data: TipFormData) => {
  loading.value = true;

  try {
    const tipData: Record<string, unknown> = {
      kind: data.kind,
      title: data.title,
      content: data.content,
      categories: data.tags,
    };

    if (data.address) tipData.address = data.address;
    if (data.lat !== undefined && data.lng !== undefined) {
      tipData.latitude = data.lat;
      tipData.longitude = data.lng;
    }

    if (data.images.length > 0) {
      const formData = new FormData();
      data.images.slice(0, 5).forEach((image) => formData.append('images', image));
      tipData.images = await api.post<string[]>(API_ROUTES.UPLOADS.TIP_IMAGES, formData);
    }

    await api.post(API_ROUTES.TIPS.CREATE, tipData);

    toast.success(
      'Votre publication sera visible après validation par un modérateur.',
      data.kind === 'QUESTION' ? 'Question envoyée' : 'Tip créé',
    );

    setTimeout(() => {
      router.push('/my-tips');
    }, 1500);
  } catch (error) {
    console.error('erreur creation tip:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header Page -->
    <div class="mb-8">
      <h1 class="text-3xl font-black text-slate-800 dark:text-white mb-2">
        Partager un
        <span class="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600"
          >Tip</span
        >
      </h1>
      <p class="text-slate-500 dark:text-slate-400">
        Aidez la communauté en partageant vos meilleures astuces de développement.
      </p>
    </div>

    <!-- Formulaire -->
    <div
      class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl"
    >
      <p v-if="!perksLoaded" class="text-slate-400">Chargement…</p>
      <TipForm v-else :loading="loading" :perks="perks" @submit="handleCreateTip" />
    </div>
  </div>
</template>
