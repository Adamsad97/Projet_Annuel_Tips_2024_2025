<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GradePerks, UserPerks } from '~/types';
import { API_ROUTES } from '~/config/api';

// Avantages débloqués par le grade actuel et aperçu du grade suivant
const api = useApi();
const status = ref<UserPerks | null>(null);

const describe = (perks: GradePerks) => [
  { icon: 'tabler:calendar-plus', label: `${perks.tipsPerDay} publications par jour` },
  {
    icon: 'tabler:text-size',
    label: `${perks.maxContentLength.toLocaleString('fr-FR')} caractères`,
  },
  { icon: 'tabler:photo', label: `${perks.maxImages} image(s) par tip` },
  {
    icon: perks.canAddLocation ? 'tabler:map-pin' : 'tabler:map-pin-off',
    label: perks.canAddLocation ? 'Localisation sur la carte' : 'Pas de localisation',
  },
];

const current = computed(() => (status.value ? describe(status.value.perks) : []));
const next = computed(() =>
  status.value?.nextGrade ? describe(status.value.nextGrade.perks) : [],
);

onMounted(async () => {
  try {
    status.value = await api.get<UserPerks>(API_ROUTES.USERS.PERKS, { showErrorToast: false });
  } catch {
    status.value = null;
  }
});
</script>

<template>
  <section
    v-if="status"
    class="rounded-3xl bg-white/70 dark:bg-slate-900/70 shadow-md border border-white/50 dark:border-white/10 p-6 space-y-5"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100">
        Avantages de votre grade
        <span v-if="status.grade" class="text-purple-600">· {{ status.grade.name }}</span>
      </h2>
      <span class="text-sm text-slate-500">
        {{ status.remainingToday }} publication(s) restante(s) aujourd'hui
      </span>
    </div>

    <p v-if="!status.canPublishTip" class="text-sm text-amber-600">
      Vous pouvez déjà poser des questions. Proposer des tips se débloque à
      {{ status.minXpToPublishTip }} XP (vous en avez {{ status.xp }}).
    </p>
    <p v-if="status.isStaff" class="text-sm text-emerald-600">
      En tant que membre de l'équipe de modération, vous bénéficiez des avantages maximum.
    </p>

    <div class="grid md:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-purple-50/70 dark:bg-purple-900/20 p-4">
        <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Actuellement</h3>
        <ul class="space-y-1.5 text-sm">
          <li v-for="perk in current" :key="perk.label" class="flex items-center gap-2">
            <Icon :name="perk.icon" class="w-4 h-4 text-purple-600" /> {{ perk.label }}
          </li>
        </ul>
      </div>
      <div
        v-if="status.nextGrade && !status.isStaff"
        class="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4"
      >
        <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
          Au grade {{ status.nextGrade.name }}
          <span class="font-normal text-slate-500">
            (encore {{ status.nextGrade.xpMissing.toLocaleString('fr-FR') }} XP)
          </span>
        </h3>
        <ul class="space-y-1.5 text-sm text-slate-500">
          <li v-for="perk in next" :key="perk.label" class="flex items-center gap-2">
            <Icon :name="perk.icon" class="w-4 h-4" /> {{ perk.label }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
