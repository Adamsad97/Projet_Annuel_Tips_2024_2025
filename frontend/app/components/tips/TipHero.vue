<script setup lang="ts">
import type { Tip } from '../../../types/index';

// Props
defineProps<{
  tip: Tip;
}>();
</script>

<template>
  <div class="pt-24 pb-12 px-4 relative overflow-hidden">
    <!-- Glow effect background -->
    <div
      class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none -z-10"
    />

    <div class="max-w-5xl mx-auto text-center space-y-8 relative z-10">
      <!-- Badges Flottants -->
      <div class="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up">
        <div
          class="px-4 py-1.5 rounded-full bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/20 shadow-sm text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400"
        >
          {{ tip.publishedAgo }}
        </div>

        <div
          class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 backdrop-blur-md border border-yellow-400/20 text-yellow-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-widest"
        >
          <span class="flex gap-1">
            <Icon name="tabler:bolt-filled" class="w-3.5 h-3.5" /> {{ tip.difficulty }}.8
          </span>
          <span class="opacity-60 font-medium normal-case ml-1">Popularité</span>
        </div>
      </div>

      <!-- Title (Glass Text Effect) -->
      <h1
        class="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-br from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-200 dark:to-slate-400 leading-tight tracking-tight drop-shadow-sm"
      >
        {{ tip.title }}
      </h1>

      <!-- Tags (Glass Pills) -->
      <div class="flex flex-wrap justify-center gap-3">
        <span
          v-for="tag in tip.tags"
          :key="tag"
          class="px-4 py-1.5 rounded-xl bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide hover:bg-white/40 transition-colors cursor-default"
        >
          #{{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>
