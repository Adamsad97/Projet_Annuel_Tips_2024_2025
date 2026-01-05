<script setup lang="ts">
import ProfilPicture from '~/components/ProfilPicture.vue'
import type { Author } from '../../../types/index'

defineProps<{
  author: Author
}>()
</script>

<template>
  <aside class="lg:col-span-4 relative">
    <div class="lg:sticky lg:top-24 space-y-6">

      <!-- Auteur Card (Frosted Glass) -->
      <div
        class="bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl rounded-4xl p-6 border border-white/40 dark:border-white/5 shadow-xl ring-1 ring-white/20">
        <div class="flex items-center gap-5 mb-6">
          <ProfilPicture :src="author.avatar" />
          <div>
            <h3 class="font-black text-lg text-slate-900 dark:text-white leading-none">{{ author.name }}</h3>
            <div
              class="inline-block mt-2 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider">
              {{ author.role }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 py-5 border-t border-b border-slate-200/50 dark:border-white/5 mb-5">
          <div class="text-center">
            <div class="font-black text-slate-900 dark:text-white">{{ author.xp }}</div>
            <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">XP Total</div>
          </div>
          <div class="text-center border-l border-slate-200/50 dark:border-white/5">
            <div class="font-black text-slate-900 dark:text-white">124</div>
            <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Contrib</div>
          </div>
          <div class="text-center border-l border-slate-200/50 dark:border-white/5">
            <div class="font-black text-slate-900 dark:text-white">4.9</div>
            <div class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Note</div>
          </div>
        </div>

        <button
          class="w-full py-3.5 rounded-xl bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg backdrop-blur-sm">
          Voir le profil
        </button>
      </div>

      <!-- Actions Flottantes -->
      <div class="space-y-3">
        <button
          class="w-full py-4 rounded-3xl bg-linear-to-r from-purple-600/90 to-indigo-600/90 backdrop-blur-md text-white font-bold shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 border border-white/10">
          <Icon name="tabler:bulb" class="w-5 h-5 animate-pulse" />
          <span>Proposer une modification</span>
        </button>

        <div class="grid grid-cols-2 gap-3">
          <button
            class="py-3.5 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/30 font-bold text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm">
            <Icon name="tabler:heart" class="w-5 h-5" />
            <span class="text-xs">Liker</span>
          </button>
          <button
            class="py-3.5 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 font-bold text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm">
            <Icon name="tabler:share" class="w-5 h-5" />
            <span class="text-xs">Partager</span>
          </button>
        </div>
      </div>

    </div>
  </aside>
</template>
