<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AdminAnalytics } from '~/types';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

const api = useApi();
const analytics = ref<AdminAnalytics | null>(null);

const kpis = computed(() => {
  const data = analytics.value;
  if (!data) return [];
  return [
    {
      label: 'Utilisateurs',
      value: data.users.total,
      hint: `+${data.users.newLast30Days} sur 30 j`,
    },
    {
      label: 'Actifs (30 j)',
      value: data.users.activeLast30Days,
      hint: 'connexion ou contribution',
    },
    { label: 'Tips publiés', value: data.tips.approved, hint: `${data.tips.total} au total` },
    { label: 'Tips en attente', value: data.tips.pending, hint: 'à valider' },
    {
      label: 'Signalements ouverts',
      value: data.moderation.openReports,
      hint: 'file de modération',
    },
    { label: 'Contestations', value: data.moderation.openAppeals, hint: 'à trancher' },
    { label: 'Comptes bannis', value: data.moderation.bannedUsers, hint: 'ban en cours' },
    { label: 'Tips refusés', value: data.tips.rejected, hint: 'par la modération' },
  ];
});

const maxPerDay = computed(() =>
  Math.max(1, ...(analytics.value?.tips.perDay.map((day) => day.count) ?? [1])),
);
const maxCategory = computed(() =>
  Math.max(1, ...(analytics.value?.popularCategories.map((c) => c.tips) ?? [1])),
);

onMounted(async () => {
  try {
    analytics.value = await api.get<AdminAnalytics>(API_ROUTES.ADMIN.ANALYTICS);
  } catch {
    analytics.value = null;
  }
});
</script>

<template>
  <div v-if="!analytics" class="text-slate-400">Chargement des statistiques…</div>

  <div v-else class="space-y-8">
    <!-- Indicateurs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-4 border border-white/50 dark:border-white/5"
      >
        <div class="text-xs font-bold text-slate-500 uppercase tracking-wide">{{ kpi.label }}</div>
        <div class="text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
          {{ kpi.value.toLocaleString('fr-FR') }}
        </div>
        <div class="text-xs text-slate-400">{{ kpi.hint }}</div>
      </div>
    </div>

    <!-- Tips créés par jour -->
    <section class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5">
      <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">
        Tips créés par jour (30 derniers jours)
      </h3>
      <div class="flex items-end gap-1 h-40" role="img" aria-label="Tips créés par jour">
        <div
          v-for="day in analytics.tips.perDay"
          :key="day.date"
          class="flex-1 bg-purple-500/80 hover:bg-purple-600 rounded-t transition-colors min-h-[2px]"
          :style="{ height: `${(day.count / maxPerDay) * 100}%` }"
          :title="`${new Date(day.date).toLocaleDateString('fr-FR')} : ${day.count} tip(s)`"
        />
      </div>
      <div class="flex justify-between text-[11px] text-slate-400 mt-1">
        <span>{{ new Date(analytics.tips.perDay[0]!.date).toLocaleDateString('fr-FR') }}</span>
        <span>Aujourd'hui</span>
      </div>
    </section>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Catégories populaires -->
      <section class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">Catégories populaires</h3>
        <p v-if="analytics.popularCategories.length === 0" class="text-sm text-slate-500">
          Aucune catégorie.
        </p>
        <ul class="space-y-2">
          <li v-for="category in analytics.popularCategories" :key="category.id">
            <div class="flex justify-between text-sm mb-0.5">
              <span class="text-slate-700 dark:text-slate-200">{{ category.name }}</span>
              <span class="font-bold tabular-nums">{{ category.tips }}</span>
            </div>
            <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                class="h-full bg-emerald-500 rounded-full"
                :style="{ width: `${(category.tips / maxCategory) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </section>

      <!-- Meilleurs contributeurs -->
      <section class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-4">Meilleurs contributeurs</h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-slate-500 uppercase">
              <th class="pb-2">Membre</th>
              <th class="pb-2 text-right">Tips</th>
              <th class="pb-2 text-right">XP</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="contributor in analytics.topContributors"
              :key="contributor.id"
              class="border-t border-slate-100 dark:border-slate-700"
            >
              <td class="py-2">
                <NuxtLink
                  :to="ROUTES.USER_PROFILE(contributor.id)"
                  class="font-medium hover:text-purple-600"
                >
                  {{ contributor.username }}
                </NuxtLink>
              </td>
              <td class="py-2 text-right tabular-nums">{{ contributor.tips }}</td>
              <td class="py-2 text-right tabular-nums">
                {{ contributor.xp.toLocaleString('fr-FR') }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>
