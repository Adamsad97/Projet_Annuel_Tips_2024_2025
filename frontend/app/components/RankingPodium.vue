<script setup lang="ts">
// import ProfilPicture from '~/components/ProfilPicture.vue'
import type { RankingUser } from '~/types';

interface Props {
  top1: RankingUser;
  top2: RankingUser | undefined;
  top3: RankingUser | undefined;
  statKey: 'xp' | 'tips' | 'votes';
  statLabel: string;
}

defineProps<Props>();
</script>

<template>
  <section class="relative">
    <!-- Background Glow -->
    <div class="absolute inset-0 bg-linear-to-b from-purple-500/10 to-transparent blur-xl -z-10" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end max-w-5xl mx-auto">
      <!-- #2 (Gauche) -->
      <div v-if="top2" class="order-2 lg:order-1 group">
        <div
          class="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-slate-600 rounded-3xl p-8 text-center shadow-2xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4"
        >
          <div
            class="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-3xl bg-linear-to-br from-slate-200 to-slate-300 p-2 shadow-2xl rotate-6 group-hover:rotate-12"
          >
            <img :src="top2.avatar" class="w-full h-full rounded-2xl object-cover" />
          </div>

          <div class="mt-12 space-y-2">
            <h3 class="font-black text-xl text-slate-800 dark:text-slate-100">{{ top2.name }}</h3>
            <div
              class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-600 font-bold"
            >
              {{ top2.role }}
            </div>
          </div>

          <div class="text-4xl font-black text-slate-400 mt-4">{{ top2[statKey] }}</div>

          <div
            class="absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-200 text-slate-700 font-black text-2xl flex items-center justify-center rounded-2xl border-4 border-white shadow-lg"
          >
            2
          </div>
        </div>
      </div>

      <!-- #1 (Centre) -->
      <div class="order-1 lg:order-2 relative z-10">
        <div
          class="relative bg-linear-to-b from-yellow-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 backdrop-blur-xl border-4 border-yellow-400/50 rounded-3xl p-10 text-center shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-500/40 transition-all duration-700 hover:scale-105"
        >
          <Icon
            name="tabler:crown"
            class="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 text-yellow-400 drop-shadow-2xl animate-bounce"
          />

          <div
            class="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-3xl bg-linear-to-br from-yellow-400 to-orange-400 p-3 shadow-2xl"
          >
            <img :src="top1.avatar" class="w-full h-full rounded-2xl object-cover" />
          </div>

          <div class="mt-28 space-y-3">
            <h2 class="font-black text-3xl text-slate-900 dark:text-white tracking-tight">
              {{ top1.name }}
            </h2>
            <div
              class="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-yellow-400 to-orange-400 text-white text-sm font-bold rounded-2xl shadow-lg"
            >
              <Icon name="tabler:star-filled" class="w-4 h-4" />
              {{ top1.role }}
            </div>
            <div
              class="text-5xl font-black bg-linear-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent"
            >
              {{ top1[statKey] }}
            </div>
            <div class="text-xs font-bold uppercase tracking-widest text-slate-500">
              {{ statLabel }}
            </div>
          </div>

          <div
            class="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-linear-to-br from-yellow-400 to-orange-500 text-white font-black text-3xl flex items-center justify-center rounded-3xl border-8 border-white shadow-2xl"
          >
            1
          </div>
        </div>
      </div>

      <!-- #3 (Droite) -->
      <div v-if="top3" class="order-3 lg:order-3 group">
        <div
          class="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/50 dark:border-slate-600 rounded-3xl p-8 text-center shadow-2xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4"
        >
          <div
            class="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-3xl bg-linear-to-br from-orange-300 to-orange-100 p-2 shadow-2xl -rotate-6 group-hover:-rotate-12"
          >
            <img :src="top3.avatar" class="w-full h-full rounded-2xl object-cover" />
          </div>

          <div class="mt-12 space-y-2">
            <h3 class="font-black text-xl text-slate-800 dark:text-slate-100">{{ top3.name }}</h3>
            <div
              class="text-xs bg-orange-200 dark:bg-orange-900/50 px-2 py-1 rounded-full text-orange-700 font-bold"
            >
              {{ top3.role }}
            </div>
          </div>

          <div
            class="text-4xl font-black bg-linear-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
          >
            {{ top3[statKey] }}
          </div>

          <div
            class="absolute -bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-orange-400 text-white font-black text-2xl flex items-center justify-center rounded-2xl border-4 border-white shadow-lg"
          >
            3
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
