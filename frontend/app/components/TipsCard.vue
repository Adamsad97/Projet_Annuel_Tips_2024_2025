<script setup lang="ts">
import ProfilPicture from '@/components/ProfilPicture.vue'
import type { Tip } from '@@/types'

interface Props {
  tip: Tip
}

defineProps<Props>()
</script>

<template>
  <NuxtLink :to="`/tips/${tip.id}`"
    class="group rounded-3xl bg-linear-to-r from-purple-100/70 to-white dark:from-purple-900/70 dark:to-slate-900 shadow-md hover:shadow-xl px-6 md:px-10 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:-translate-y-1 transition-all duration-300">
    <div class="flex-1">
      <h2 class="text-lg md:text-xl font-semibold text-slate-800 dark:text-gray-300 mb-1">
        {{ tip.title }}
      </h2>

      <div class="text-xs text-gray-400 dark:text-gray-400 mb-2 flex flex-wrap items-center gap-2">
        <span>Publié {{ tip.publishedAgo }}</span>
        <span>·</span>
        <span>Vue {{ tip.views }} fois</span>

        <span v-if="tip.address" class="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium ml-2">
          <Icon name="tabler:map-pin" class="w-3 h-3" />
          {{ tip.address }}
        </span>

        <span v-if="tip.images && tip.images.length > 0"
          class="flex items-center gap-1 text-slate-500 dark:text-slate-400 ml-2" title="Images">
          <Icon name="tabler:photo" class="w-3 h-3" />
          {{ tip.images.length }}
        </span>
        <span v-if="tip.documents && tip.documents.length > 0"
          class="flex items-center gap-1 text-slate-500 dark:text-slate-400 ml-2" title="Documents">
          <Icon name="tabler:file-text" class="w-3 h-3" />
          {{ tip.documents.length }}
        </span>
      </div>

      <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
        {{ tip.description }}
      </p>
      <div class="flex flex-wrap gap-2 mb-3">
        <span v-for="tag in tip.tags" :key="tag"
          class="px-3 py-1 rounded-md bg-white shadow text-xs md:text-sm text-gray-700 dark:text-gray-300 dark:bg-slate-800">
          {{ tag }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-xs text-gray-500 dark:text-gray-400">Difficulté</span>
        <span v-for="i in 5" :key="i" class="flex"
          :class="i <= (tip.difficulty || 0) ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'">
          <Icon name="tabler:bolt-filled" class="w-4 h-4" />
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
            {{ tip.author?.xp?.toLocaleString('fr-FR') }} xp
          </span>
        </div>
      </div>
      <span class="text-xs text-purple-500 dark:text-purple-400 font-medium">
        Voir le détail →
      </span>
    </div>
  </NuxtLink>
</template>
