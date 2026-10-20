<script setup lang="ts">
import ProfilPicture from '~/components/ProfilPicture.vue';
import type { Author } from '~/types';
import { ROUTES } from '~/config/routes';

defineProps<{
  author: Author;
}>();
</script>

<template>
  <aside class="lg:col-span-4 relative">
    <div class="lg:sticky lg:top-24 space-y-6">
      <!-- Auteur Card (Frosted Glass) -->
      <div
        class="bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl rounded-4xl p-6 border border-white/40 dark:border-white/5 shadow-xl ring-1 ring-white/20"
      >
        <div class="flex items-center gap-5 mb-6">
          <ProfilPicture :src="author.avatar || undefined" :alt="author.name" :online="false" />
          <div>
            <h3 class="font-black text-lg text-slate-900 dark:text-white leading-none">
              {{ author.name }}
            </h3>
            <div
              class="inline-block mt-2 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider"
            >
              {{ author.role }}
            </div>
          </div>
        </div>

        <NuxtLink
          v-if="author.id"
          :to="ROUTES.USER_PROFILE(author.id)"
          class="block w-full py-3.5 rounded-xl bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 font-bold text-sm text-center hover:scale-[1.02] transition-transform shadow-lg backdrop-blur-sm"
        >
          Voir le profil
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>
