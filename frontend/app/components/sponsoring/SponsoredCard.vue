<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PublicAd } from '~/types';
import { API_ROUTES } from '~/config/api';

// Tip sponsorisé (publicité native) : toujours marqué "Sponsorisé", lien en rel="sponsored"
const props = defineProps<{
  // Catégorie consultée, pour le ciblage
  categoryId?: number | null;
}>();

const config = useRuntimeConfig();
const api = useApi();
const ad = ref<PublicAd | null>(null);

// Chargé côté client : le token permet le ciblage des membres (grade, catégories suivies)
const load = async () => {
  try {
    const query = props.categoryId ? `?categoryId=${props.categoryId}` : '';
    ad.value = await api.get<PublicAd | null>(`${API_ROUTES.SPONSORING.PLACEMENT}${query}`, {
      showErrorToast: false,
    });
  } catch {
    ad.value = null;
  }
};

const clickUrl = (id: number) => `${config.public.apiBaseUrl}${API_ROUTES.SPONSORING.CLICK(id)}`;

watch(() => props.categoryId, load);
onMounted(load);
</script>

<template>
  <aside
    v-if="ad"
    class="rounded-3xl border border-amber-200/70 dark:border-amber-700/40 bg-linear-to-r from-amber-50/80 to-white dark:from-amber-900/20 dark:to-slate-900 shadow-md px-6 md:px-10 py-6 flex flex-col md:flex-row gap-6 items-start"
    aria-label="Contenu sponsorisé"
  >
    <img
      v-if="ad.imageUrl"
      :src="resolveUploadUrl(ad.imageUrl, config.public.apiBaseUrl)"
      :alt="ad.title"
      class="w-full md:w-40 h-28 object-cover rounded-2xl"
      loading="lazy"
    />
    <div class="flex-1 space-y-2">
      <p class="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
        Sponsorisé · {{ ad.sponsorName }}
      </p>
      <h2 class="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100">
        {{ ad.title }}
      </h2>
      <p class="text-sm text-slate-600 dark:text-slate-300">{{ ad.body }}</p>
      <a
        :href="clickUrl(ad.id)"
        target="_blank"
        rel="sponsored noopener noreferrer"
        class="inline-flex items-center gap-1 text-sm font-bold text-amber-700 dark:text-amber-400 hover:underline"
      >
        Découvrir <Icon name="tabler:external-link" class="w-4 h-4" />
      </a>
    </div>
  </aside>
</template>
