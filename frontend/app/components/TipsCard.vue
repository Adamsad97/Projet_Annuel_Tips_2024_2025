<script setup lang="ts">
import ProfilPicture from '@/components/ProfilPicture.vue';
import type { Tip } from '~/types';

interface Props {
  tip: Tip;
}

defineProps<Props>();
</script>

<template>
  <NuxtLink
    :to="`/tips/${tip.id}`"
    class="group rounded-3xl bg-linear-to-r from-purple-100/70 to-white dark:from-purple-900/70 dark:to-slate-900 shadow-md hover:shadow-xl px-6 md:px-10 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:-translate-y-1 transition-all duration-300"
  >
    <div class="flex-1">
      <h2 class="text-lg md:text-xl font-semibold text-slate-800 dark:text-gray-300 mb-1">
        <span
          v-if="tip.kind === 'QUESTION'"
          class="inline-flex items-center gap-1 align-middle mr-2 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wide"
        >
          <Icon name="tabler:help-circle" class="w-3 h-3" /> Question
        </span>
        {{ tip.title }}
      </h2>

      <div class="text-xs text-gray-400 dark:text-gray-400 mb-2 flex flex-wrap items-center gap-2">
        <span>Publié le {{ tip.publishedAgo }}</span>
        <span>·</span>
        <span>Vue {{ tip.views }} fois</span>

        <span
          v-if="tip.address"
          class="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium ml-2"
        >
          <Icon name="tabler:map-pin" class="w-3 h-3" />
          {{ tip.address }}
        </span>

        <span
          v-if="tip.images && tip.images.length > 0"
          class="flex items-center gap-1 text-slate-500 dark:text-slate-400 ml-2"
          title="Images"
        >
          <Icon name="tabler:photo" class="w-3 h-3" />
          {{ tip.images.length }}
        </span>
      </div>

      <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
        {{ tip.description }}
      </p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in tip.tags"
          :key="tag"
          class="px-3 py-1 rounded-md bg-white shadow text-xs md:text-sm text-gray-700 dark:text-gray-300 dark:bg-slate-800"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <div class="flex flex-col items-end gap-3">
      <div class="flex items-center gap-3">
        <ProfilPicture :src="tip.author?.avatar" :alt="tip.author?.name" />
        <div class="flex flex-col items-start">
          <span class="text-sm text-teal-700 dark:text-teal-400 font-medium">
            {{ tip.author?.name }}
          </span>
          <span class="text-xs text-gray-600 dark:text-gray-400">
            {{ tip.author?.role }} · {{ tip.author?.xp?.toLocaleString('fr-FR') }} XP
          </span>
        </div>
      </div>
      <span class="text-xs text-purple-500 dark:text-purple-400 font-medium">
        Voir le détail →
      </span>
    </div>
  </NuxtLink>
</template>
