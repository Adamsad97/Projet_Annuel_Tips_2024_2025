<script setup lang="ts">
import type { CurrentUser } from '~/types';

interface Props {
  user: CurrentUser;
}

defineProps<Props>();
</script>

<template>
  <div class="sticky bottom-8 mx-auto w-full max-w-2xl pointer-events-none">
    <div
      class="pointer-events-auto bg-linear-to-r from-slate-900/50 to-purple-900/50 dark:from-slate-100/50 dark:to-purple-100/50 backdrop-blur-xs text-white dark:text-slate-900 p-4 pl-6 pr-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-900/20 flex items-center justify-between gap-6 hover:scale-105 transition-all duration-300 group cursor-pointer"
    >
      <!-- Rang & Avatar CÔTÉ À CÔTÉ -->
      <div class="flex items-center gap-3">
        <!-- Badge Rang -->
        <div
          class="w-14 h-14 bg-linear-to-br from-purple-500/25 to-pink-500/25 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-xl group-hover:shadow-2xl transition-all"
        >
          <span class="font-black text-2xl text-white drop-shadow-lg">#{{ user.rank }}</span>
        </div>

        <!-- PP à côté -->
        <img
          :src="user.avatar"
          :alt="user.name"
          class="w-12 h-12 rounded-2xl border-4 border-white/60 shadow-2xl group-hover:scale-105 transition-transform duration-300 object-cover"
        />
      </div>

      <!-- Infos utilisateur -->
      <div class="flex-1 min-w-0 px-4">
        <div class="font-bold text-lg leading-tight drop-shadow-lg text-center md:text-left">
          C'est toi !
        </div>
        <div
          class="text-xs bg-linear-to-r from-emerald-400/80 to-teal-400/80 px-3 py-0.5 rounded-full font-bold uppercase tracking-wider drop-shadow-md mx-auto md:ml-0 w-fit mt-1"
        >
          {{ user.role }}
        </div>
      </div>

      <!-- Stats (droite) -->
      <div class="text-right divide-y divide-white/20 shrink-0">
        <div class="text-3xl font-black leading-none drop-shadow-2xl">
          {{ user.xp.toLocaleString() }}
        </div>
        <div class="flex items-center justify-end gap-1 text-sm font-bold text-emerald-400 pt-1">
          <Icon name="tabler:trending-up" class="w-4 h-4 animate-pulse" />
          {{ user.trend }} cette semaine
        </div>
      </div>
    </div>
  </div>
</template>
