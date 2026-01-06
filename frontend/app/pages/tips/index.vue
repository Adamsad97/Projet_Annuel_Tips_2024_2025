<script setup lang="ts">
import type { Tip } from '~/types';
const TipsCard = defineAsyncComponent(() => import('~/components/TipsCard.vue'));

const route = useRoute();
const searchQuery = ref((route.query.q as string) || '');
const selectedTag = ref<string | null>(null);
const selectedDifficulty = ref<number | null>(null);

const { data: availableTags } = await useFetch<string[]>('/api/tags');

const { data: filteredTips } = await useFetch<Tip[]>('/api/tips', {
  query: computed(() => ({
    q: searchQuery.value,
    tag: selectedTag.value,
    difficulty: selectedDifficulty.value,
  })),
  watch: [searchQuery, selectedTag, selectedDifficulty],
});

watch(
  () => route.query.q,
  (newQ) => {
    searchQuery.value = (newQ as string) || '';
  },
);

const resetFilters = () => {
  searchQuery.value = '';
  selectedTag.value = null;
  selectedDifficulty.value = null;
};
</script>

<template>
  <div class="min-h-screen py-12 px-4 max-w-7xl mx-auto space-y-8">
    <!-- Header & Search -->
    <div class="flex flex-col md:flex-row justify-between items-end gap-6 animate-fade-in-up">
      <div>
        <h1 class="text-4xl font-black text-slate-900 dark:text-white mb-2">
          Explorer les
          <span class="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-500"
            >Tips</span
          >
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Trouvez la solution à votre problème technique.
        </p>
      </div>

      <!-- Barre de recherche intelligente -->
      <div class="relative w-full md:w-96 group">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon
            name="tabler:search"
            class="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors"
          />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher (ex: React, Docker...)"
          class="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-400 text-slate-800 dark:text-white"
        />
      </div>
    </div>

    <!-- Filtres Avancés -->
    <div
      class="flex flex-wrap items-center gap-4 bg-white/30 dark:bg-slate-900/30 p-4 rounded-2xl border border-white/20 dark:border-slate-800 backdrop-blur-sm"
    >
      <div
        class="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider mr-2"
      >
        <Icon name="tabler:filter" class="w-4 h-4" /> Filtres
      </div>

      <!-- Tags -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in availableTags"
          :key="tag"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
          :class="
            selectedTag === tag
              ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white/50 dark:bg-slate-800/50 border-transparent text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
          "
          @click="selectedTag = selectedTag === tag ? null : tag"
        >
          #{{ tag }}
        </button>
      </div>

      <div class="w-px h-6 bg-gray-300 dark:bg-slate-700 mx-2 hidden md:block" />

      <!-- Difficulté -->
      <div class="flex items-center gap-1">
        <button
          v-for="i in 5"
          :key="i"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all border"
          :class="
            selectedDifficulty === i
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-white/50 dark:bg-slate-800/50 border-transparent text-gray-400 hover:bg-white dark:hover:bg-slate-700'
          "
          :title="`Difficulté ${i}`"
          @click="selectedDifficulty = selectedDifficulty === i ? null : i"
        >
          <Icon
            name="tabler:bolt"
            class="w-4 h-4"
            :class="{ 'fill-current': selectedDifficulty === i }"
          />
        </button>
      </div>

      <!-- Reset -->
      <button
        v-if="searchQuery || selectedTag || selectedDifficulty"
        class="ml-auto text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
        @click="resetFilters"
      >
        <Icon name="tabler:x" /> Effacer
      </button>
    </div>

    <!-- Grille de résultats -->
    <div v-if="filteredTips && filteredTips.length > 0" class="grid gap-6">
      <TipsCard v-for="tip in filteredTips" :key="tip.id" :tip="tip" />
    </div>

    <!-- État vide -->
    <div v-else class="text-center py-20">
      <div
        class="bg-gray-100 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <Icon name="tabler:telescope" class="w-10 h-10 text-gray-400" />
      </div>
      <h3 class="text-xl font-bold text-slate-700 dark:text-slate-200">Aucun résultat trouvé</h3>
      <p class="text-gray-500">Essayez de modifier vos filtres ou votre recherche.</p>
      <button class="mt-4 text-purple-500 font-bold hover:underline" @click="resetFilters">
        Réinitialiser tout
      </button>
    </div>
  </div>
</template>
