<script setup lang="ts">
interface Props {
  timeFilter: 'week' | 'month' | 'all';
  categoryFilter: 'xp' | 'tips' | 'votes';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:timeFilter', value: 'week' | 'month' | 'all'): void;
  (e: 'update:categoryFilter', value: 'xp' | 'tips' | 'votes'): void;
}>();

const timeOptions = [
  { key: 'week' as const, label: 'Semaine' },
  { key: 'month' as const, label: 'Mois' },
  { key: 'all' as const, label: 'Toujours' },
] as const;

const categoryOptions = [
  { key: 'xp' as const, label: 'XP Global', icon: 'tabler:trophy' },
  { key: 'tips' as const, label: 'Contribution', icon: 'tabler:bulb' },
  { key: 'votes' as const, label: 'Popularité', icon: 'tabler:heart' },
] as const;
</script>

<template>
  <div class="flex flex-col lg:flex-row items-end justify-between gap-6">
    <!-- Titre -->
    <div>
      <h1
        class="text-4xl md:text-5xl font-black bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-200 tracking-tight"
      >
        Classement Elite
      </h1>
    </div>

    <!-- Filtres -->
    <div class="flex flex-col sm:flex-row gap-4 w-full lg:w-auto lg:gap-6">
      <!-- Catégorie -->
      <div
        class="flex gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-2 rounded-2xl border border-white/30 dark:border-slate-700 shadow-lg"
      >
        <button
          v-for="option in categoryOptions"
          :key="option.key"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all group"
          :class="
            props.categoryFilter === option.key
              ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 scale-[1.05]'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-slate-700/70'
          "
          @click="emit('update:categoryFilter', option.key)"
        >
          <Icon :name="option.icon" class="w-4 h-4" />
          {{ option.label }}
        </button>
      </div>

      <!-- Période -->
      <div
        class="flex gap-1 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-xl backdrop-blur-sm border border-white/30 dark:border-slate-700 shadow-md"
      >
        <button
          v-for="option in timeOptions"
          :key="option.key"
          class="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          :class="
            props.timeFilter === option.key
              ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          "
          @click="emit('update:timeFilter', option.key)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>
