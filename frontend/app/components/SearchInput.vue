<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: 'Recherche...',
  },
);

const route = useRoute();
const search = ref('');

watch(
  () => route.query.q,
  (newQ) => {
    search.value = (newQ as string) || '';
  },
  { immediate: true },
);

const handleSearch = () => {
  navigateTo({
    path: '/tips',
    query: { q: search.value || undefined },
  });
};
</script>

<template>
  <div class="relative w-full">
    <span class="absolute inset-y-0 left-2 flex items-center pointer-events-none">
      <icon name="tabler:search" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
    </span>
    <input
      v-model="search"
      :placeholder="placeholder"
      type="text"
      class="w-full rounded-full pl-9 pr-6 py-2 bg-purple-50 dark:bg-purple-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-600 transition-all text-slate-800 dark:text-slate-100 placeholder-gray-400"
      v-bind="$attrs"
      @keydown.enter="handleSearch"
    />
  </div>
</template>
