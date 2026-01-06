<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import type { Tip } from '~/types';
import AppButton from '~/components/ui/AppButton.vue';

const TipsCard = defineAsyncComponent(() => import('~/components/TipsCard.vue'));

const runtimeConfig = useRuntimeConfig();
const apiBaseUrl = runtimeConfig.public.apiBaseUrl?.replace(/\/$/, '');
const { data: tips } = await useFetch<Tip[]>(apiBaseUrl ? `${apiBaseUrl}/tips` : '/api/tips', {
  default: () => [],
});

definePageMeta({
  layout: 'default',
});
</script>

<template>
  <div class="space-y-12 pb-12">
    <!-- HERO SECTION -->
    <section class="relative rounded-3xl pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
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
          class="text-4xl md:text-6xl font-black text-slate-800 dark:text-white leading-tight mb-6"
        >
          L’entraide sur
          <span class="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600"
            >tous types de sujets</span
          >
        </h1>

        <p
          class="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Bricolage, Cuisine, Informatique, Jardinage... Peu importe votre besoin, trouvez la
          solution ou aidez quelqu'un aujourd'hui.
        </p>

        <ul
          class="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed list-none space-y-2"
        >
          <li class="flex items-center justify-center gap-2">
            <Icon name="tabler:check" class="text-green-500" />
            Trouver une réponse fiable rapidement
          </li>
          <li class="flex items-center justify-center gap-2">
            <Icon name="tabler:message-question" class="text-blue-500" />
            Poser une question sur un sujet
          </li>
          <li class="flex items-center justify-center gap-2">
            <Icon name="tabler:users" class="text-purple-500" />
            Partagez votre savoir avec le monde
          </li>
        </ul>

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
        <TipsCard v-for="tip in tips" :key="tip.id" :tip="tip" />
      </div>
    </section>
  </div>
</template>
