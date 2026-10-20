<script setup lang="ts">
import { ref } from 'vue';
import type { ActiveChallenge } from '~/types';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

// Défis sponsorisés en cours : bonus d'XP pour un tip validé dans une catégorie
withDefaults(defineProps<{ showCta?: boolean }>(), { showCta: true });

const api = useApi();
const challenges = ref<ActiveChallenge[]>([]);

const daysLeft = (endsAt: string) =>
  Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

onMounted(async () => {
  try {
    challenges.value = await api.get<ActiveChallenge[]>(API_ROUTES.SPONSORING.CHALLENGES, {
      showErrorToast: false,
    });
  } catch {
    challenges.value = [];
  }
});
</script>

<template>
  <section v-if="challenges.length > 0" class="space-y-3" aria-label="Défis sponsorisés">
    <div
      v-for="challenge in challenges"
      :key="challenge.id"
      class="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-900/20 px-5 py-4 flex flex-wrap items-center gap-4"
    >
      <Icon name="tabler:trophy" class="w-8 h-8 text-emerald-600 shrink-0" />
      <div class="flex-1 min-w-[14rem]">
        <p
          class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400"
        >
          Défi sponsorisé par {{ challenge.sponsorName }} · #{{ challenge.category.name }}
        </p>
        <p class="font-bold text-slate-800 dark:text-slate-100">
          {{ challenge.title }} :
          <span class="text-emerald-700 dark:text-emerald-400">+{{ challenge.xpBonus }} XP</span>
        </p>
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ challenge.description }}</p>
        <p class="text-xs text-slate-500 mt-1">
          Encore {{ daysLeft(challenge.endsAt) }} jour(s)
          <template v-if="challenge.remainingRewards !== null">
            · {{ challenge.remainingRewards }} récompense(s) restante(s)
          </template>
        </p>
      </div>
      <span
        v-if="challenge.completedByMe"
        class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
      >
        ✓ Défi réussi
      </span>
      <NuxtLink
        v-else-if="showCta && challenge.remainingRewards !== 0"
        :to="ROUTES.TIP_CREATE"
        class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
      >
        Relever le défi
      </NuxtLink>
    </div>
  </section>
</template>
