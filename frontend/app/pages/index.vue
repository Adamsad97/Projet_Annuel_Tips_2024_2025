<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import type { Tip } from '~/types';
import AppButton from '~/components/ui/AppButton.vue';

const TipsCard = defineAsyncComponent(() => import('~/components/TipsCard.vue'));

const config = useRuntimeConfig();
const apiBaseUrl = config.public.apiBaseUrl;

const { data: rawResponse } = await useFetch<{ success: boolean; data: Tip[] }>(`${apiBaseUrl}/tips`, {
  default: () => ({ success: true, data: [] }),
});

const tips = computed(() => rawResponse.value?.data || []);
const tipsList = ref<Tip[]>(tips.value);

const ws = useWebSocket();

onMounted(() => {
  ws.connect();

  ws.onTipApproved((newTip) => {
    tipsList.value = [newTip as unknown as Tip, ...tipsList.value];
  });
});

onUnmounted(() => {
  ws.off('tip:approved');
  ws.disconnect();
});

// Mettre à jour la liste quand les données changent
watch(tips, (newTips) => {
  if (newTips) {
    tipsList.value = newTips;
  }
});

definePageMeta({
  layout: 'default',
});
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- HERO SECTION -->
    <section class="relative rounded-3xl pt-8 pb-8 md:pt-12 md:pb-12 overflow-hidden">
      <!-- Background Elements -->
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-full bg-linear-to-b from-purple-50/50 to-white dark:from-slate-900 dark:to-slate-950 -z-10"
      />
      <div
        class="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"
      />
      <div
        class="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4"
      />

      <div class="max-w-5xl mx-auto px-6 text-center">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-6"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"
            />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
          </span>
          La plateforme d'entraide n°1
        </div>

        <h1
          class="text-3xl md:text-5xl font-black text-slate-800 dark:text-white leading-tight mb-4"
        >
          L'entraide sur
          <span class="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600"
            >tous types de sujets</span
          >
        </h1>

        <p
          class="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-6 leading-relaxed"
        >
          Bricolage, Cuisine, Informatique, Jardinage... Trouvez la solution ou aidez quelqu'un aujourd'hui.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <AppButton
            to="/tips/create"
            variant="primary"
            size="lg"
            class="w-full sm:w-auto shadow-lg shadow-purple-500/25"
          >
            <Icon name="tabler:plus" class="w-5 h-5 mr-2" />
            Partager un Tip
          </AppButton>
          <AppButton to="/tips" variant="secondary" size="lg" class="w-full sm:w-auto">
            <Icon name="tabler:compass" class="w-5 h-5 mr-2" />
            Explorer les Tips
          </AppButton>
        </div>
      </div>
    </section>

    <!-- LATEST TIPS -->
    <section class="max-w-5xl mx-auto px-6">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Icon name="tabler:flame" class="w-6 h-6 text-orange-500" />
          Derniers Tips ajoutés
        </h2>
        <NuxtLink
          to="/tips"
          class="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
        >
          Voir tout &rarr;
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-6">
        <TipsCard v-for="tip in tipsList" :key="tip.id" :tip="tip" />
      </div>
    </section>
  </div>
</template>
