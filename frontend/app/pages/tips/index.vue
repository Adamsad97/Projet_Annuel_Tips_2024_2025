<script setup lang="ts">
import type { ApiTip, Tip } from '~/types';
const TipsCard = defineAsyncComponent(() => import('~/components/TipsCard.vue'));
const SponsoredCard = defineAsyncComponent(
  () => import('~/components/sponsoring/SponsoredCard.vue'),
);
const ChallengesBanner = defineAsyncComponent(
  () => import('~/components/sponsoring/ChallengesBanner.vue'),
);

const route = useRoute();
const config = useRuntimeConfig();
const apiBaseUrl = config.public.apiBaseUrl;
const searchQuery = ref((route.query.q as string) || '');
const selectedTag = ref<string | null>(null);
const selectedKind = ref<'TIP' | 'QUESTION' | null>(null);

const { data: rawTagsResponse } = await useFetch<{ success: boolean; data: string[] }>(
  `${apiBaseUrl}/tips/tags/all`,
);
const availableTags = computed<string[]>(() => {
  const tags = rawTagsResponse.value?.data || [];
  console.log('[Tips] Tags loaded:', { hasData: !!rawTagsResponse.value, tagsCount: tags.length });
  return tags;
});

const { data: rawTipsResponse } = await useFetch<{ success: boolean; data: ApiTip[] }>(
  `${apiBaseUrl}/tips`,
  {
    query: computed(() => ({
      q: searchQuery.value || undefined,
      category: selectedTag.value ?? undefined,
      kind: selectedKind.value ?? undefined,
    })),
    watch: [searchQuery, selectedTag, selectedKind],
  },
);

const filteredTips = computed<Tip[]>(() => {
  const tips = rawTipsResponse.value?.data || [];
  return tips.map((tip) => mapApiTip(tip, apiBaseUrl));
});

watch(
  () => route.query.q,
  (newQ) => {
    searchQuery.value = (newQ as string) || '';
  },
);

// Suivi de la catégorie sélectionnée (notification à chaque nouveau tip publié)
const { loadCategories, findByName, toggleFollow } = useCategoryFollow();
const selectedCategory = computed(() => (selectedTag.value ? findByName(selectedTag.value) : null));
onMounted(loadCategories);

const resetFilters = () => {
  searchQuery.value = '';
  selectedTag.value = null;
  selectedKind.value = null;
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

    <!-- Défis sponsorisés en cours -->
    <ChallengesBanner />

    <!-- Type de publication -->
    <div class="flex gap-2">
      <button
        v-for="option in [
          { value: null, label: 'Tout' },
          { value: 'TIP' as const, label: 'Tips' },
          { value: 'QUESTION' as const, label: 'Questions' },
        ]"
        :key="option.label"
        type="button"
        class="px-4 py-2 rounded-xl text-sm font-bold transition"
        :class="
          selectedKind === option.value
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
            : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white'
        "
        @click="selectedKind = option.value"
      >
        {{ option.label }}
      </button>
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

      <button
        v-if="selectedCategory"
        type="button"
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition"
        :class="
          selectedCategory.isFollowed
            ? 'border-purple-300 text-purple-600 bg-purple-50 dark:bg-purple-900/20'
            : 'border-transparent bg-purple-600 text-white hover:bg-purple-700'
        "
        :title="`Recevoir une notification à chaque nouveau tip dans ${selectedCategory.name}`"
        @click="toggleFollow(selectedCategory)"
      >
        <Icon
          :name="selectedCategory.isFollowed ? 'tabler:bell-off' : 'tabler:bell-plus'"
          class="w-4 h-4"
        />
        {{ selectedCategory.isFollowed ? 'Ne plus suivre' : 'Suivre' }} #{{ selectedCategory.name }}
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-slate-700 mx-2 hidden md:block" />

      <!-- Reset -->
      <button
        v-if="searchQuery || selectedTag || selectedKind"
        class="ml-auto text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
        @click="resetFilters"
      >
        <Icon name="tabler:x" /> Effacer
      </button>
    </div>

    <!-- Grille de résultats -->
    <div v-if="filteredTips && filteredTips.length > 0" class="grid gap-6">
      <template v-for="(tip, index) in filteredTips" :key="tip.id">
        <TipsCard :tip="tip" />
        <!-- Un seul encart sponsorisé, après le 3e tip (ou à la fin d'une liste plus courte) -->
        <SponsoredCard
          v-if="index === Math.min(2, filteredTips.length - 1)"
          :category-id="selectedCategory?.id ?? null"
        />
      </template>
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
