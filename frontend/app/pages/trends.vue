<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ApiTip } from '~/types';
import TipsCard from '~/components/TipsCard.vue';
import { API_ROUTES } from '~/config/api';

useSeoMeta({
  title: 'Tendances',
  description: 'Les tips les plus populaires du moment sur AideFlash.',
});

const PERIODS = [
  { days: 1, label: "Aujourd'hui" },
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
] as const;

const config = useRuntimeConfig();
const api = useApi();
const { isAuthenticated } = useAuth();
const period = ref<number>(7);

// Rendu serveur pour les visiteurs (aperçus) ; un membre connecté recharge avec son token
const { data, refresh } = await useFetch<{ success: boolean; data: ApiTip[] }>(
  `${config.public.apiBaseUrl}${API_ROUTES.TIPS.TRENDING}`,
  { query: computed(() => ({ days: period.value })), watch: [period] },
);

const memberTips = ref<ApiTip[] | null>(null);
const loadMemberTips = async () => {
  if (!isAuthenticated.value) return;
  try {
    memberTips.value = await api.get<ApiTip[]>(`${API_ROUTES.TIPS.TRENDING}?days=${period.value}`, {
      showErrorToast: false,
    });
  } catch {
    memberTips.value = null;
  }
};

watch(period, () => {
  memberTips.value = null;
  loadMemberTips();
});
onMounted(loadMemberTips);

const tips = computed(() =>
  (memberTips.value ?? data.value?.data ?? []).map((tip) => ({
    tip: mapApiTip(tip, config.public.apiBaseUrl),
    stats: tip.trending,
  })),
);
</script>

<template>
  <div class="min-h-screen py-12 px-4 max-w-5xl mx-auto space-y-8">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-4xl font-black text-slate-900 dark:text-white mb-2">
          <Icon name="tabler:flame" class="text-orange-500" />
          Tendances
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Les tips qui font le plus réagir : votes, commentaires et vues sur la période.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="option in PERIODS"
          :key="option.days"
          type="button"
          class="px-4 py-2 rounded-xl text-sm font-bold transition"
          :class="
            period === option.days
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white'
          "
          @click="period = option.days"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-if="tips.length === 0" class="text-center py-20 text-slate-500">
      <Icon name="tabler:mood-empty" class="w-12 h-12 mx-auto mb-2 text-slate-300" />
      Rien de tendance sur cette période pour l'instant.
      <button
        class="block mx-auto mt-3 text-purple-600 font-bold hover:underline"
        @click="refresh()"
      >
        Actualiser
      </button>
    </div>

    <ol v-else class="space-y-6">
      <li v-for="({ tip, stats }, index) in tips" :key="tip.id" class="relative">
        <span
          class="absolute -left-2 -top-2 z-10 w-9 h-9 rounded-full flex items-center justify-center font-black text-white shadow-lg"
          :class="index < 3 ? 'bg-orange-500' : 'bg-slate-400'"
        >
          {{ index + 1 }}
        </span>
        <TipsCard :tip="tip" />
        <div v-if="stats" class="flex gap-4 justify-end text-xs text-slate-500 mt-2 pr-4">
          <span><Icon name="tabler:thumb-up" class="w-3 h-3" /> {{ stats.upvotes }}</span>
          <span><Icon name="tabler:message" class="w-3 h-3" /> {{ stats.comments }}</span>
          <span><Icon name="tabler:eye" class="w-3 h-3" /> {{ stats.views }}</span>
        </div>
      </li>
    </ol>
  </div>
</template>
