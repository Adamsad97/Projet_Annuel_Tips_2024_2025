<script setup lang="ts">
import { ref } from 'vue';
import type { ModeratorWatchEntry, TrustCycleSummary, TrustRankingEntry } from '~/types';
import TrustBreakdownPanel from '~/components/admin/TrustBreakdownPanel.vue';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

const api = useApi();
const toast = useToastMessage();

const ranking = ref<{ highest: TrustRankingEntry[]; lowest: TrustRankingEntry[] } | null>(null);
const watchlist = ref<ModeratorWatchEntry[]>([]);
const lastCycle = ref<TrustCycleSummary | null>(null);
const recomputing = ref(false);
const selectedUserId = ref<number | null>(null);

const load = async () => {
  try {
    [ranking.value, watchlist.value] = await Promise.all([
      api.get<{ highest: TrustRankingEntry[]; lowest: TrustRankingEntry[] }>(
        API_ROUTES.ADMIN.TRUST_RANKING,
      ),
      api.get<ModeratorWatchEntry[]>(API_ROUTES.ADMIN.TRUST_WATCHLIST),
    ]);
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

const recompute = async () => {
  recomputing.value = true;
  try {
    lastCycle.value = await api.post<TrustCycleSummary>(API_ROUTES.ADMIN.TRUST_RECOMPUTE);
    toast.success(`${lastCycle.value.usersUpdated} indices recalculés`);
    await load();
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    recomputing.value = false;
  }
};

// Rétrogradation assistée : l'admin confirme le retrait du rôle
const demote = async (moderator: ModeratorWatchEntry) => {
  const reason = prompt(
    `Motif du retrait du rôle de modérateur de ${moderator.username} (10 caractères min.) :`,
    moderator.reasons.join(', '),
  );
  if (!reason || reason.trim().length < 10) return;

  try {
    await api.post(API_ROUTES.MODERATION.DEMOTE, { userId: moderator.id, reason: reason.trim() });
    toast.success(`${moderator.username} n'est plus modérateur`);
    await load();
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

onMounted(load);
</script>

<template>
  <div class="space-y-8">
    <!-- Fonctionnement et recalcul -->
    <section class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5 space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-2xl text-sm text-slate-600 dark:text-slate-300 space-y-1">
          <p>
            L'indice (0 à 100, base 50) mesure la fiabilité d'un membre à partir de ses
            contributions validées, des votes reçus, de son ancienneté et de son comportement
            (sanctions, contenus retirés, signalements abusifs). Il n'est jamais montré aux membres.
          </p>
          <p>
            Il est recalculé toutes les heures et après chaque sanction. Il sert à bloquer la montée
            en grade des comptes peu fiables, à promouvoir automatiquement les membres fiables en
            modérateurs et à retirer le rôle aux modérateurs dont l'indice chute.
          </p>
        </div>
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
          :disabled="recomputing"
          @click="recompute"
        >
          {{ recomputing ? 'Recalcul…' : 'Recalculer maintenant' }}
        </button>
      </div>
      <p v-if="lastCycle" class="text-sm text-slate-500">
        Dernier recalcul : {{ lastCycle.usersUpdated }} indices,
        {{ lastCycle.promoted.length }} promotion(s), {{ lastCycle.demoted.length }} retrait(s) de
        rôle, {{ lastCycle.watchlist.length }} modérateur(s) à surveiller.
      </p>
    </section>

    <!-- Rétrogradation assistée -->
    <section class="space-y-3">
      <h3 class="text-lg font-bold text-slate-900 dark:text-white">Modérateurs à surveiller</h3>
      <p v-if="watchlist.length === 0" class="text-sm text-slate-500">
        Aucun modérateur à surveiller.
      </p>
      <ul v-else class="space-y-2">
        <li
          v-for="moderator in watchlist"
          :key="moderator.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 dark:bg-slate-800/60 px-4 py-3"
        >
          <div>
            <button
              type="button"
              class="font-bold hover:text-purple-600"
              @click="selectedUserId = moderator.id"
            >
              {{ moderator.username }}
            </button>
            <span class="text-xs text-slate-500">
              · indice {{ moderator.trustIndex }} · {{ moderator.recentActions }} action(s) sur 30 j
            </span>
            <div class="text-xs text-amber-600">{{ moderator.reasons.join(' · ') }}</div>
          </div>
          <button
            type="button"
            class="text-xs font-bold text-red-500 hover:underline"
            @click="demote(moderator)"
          >
            Retirer le rôle
          </button>
        </li>
      </ul>
    </section>

    <!-- Comparaison -->
    <div v-if="ranking" class="grid md:grid-cols-2 gap-6">
      <section
        v-for="list in [
          { title: 'Membres les plus fiables', items: ranking.highest },
          { title: 'Membres les moins fiables', items: ranking.lowest },
        ]"
        :key="list.title"
        class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5"
      >
        <h3 class="font-bold text-slate-800 dark:text-slate-100 mb-3">{{ list.title }}</h3>
        <table class="w-full text-sm">
          <tbody>
            <tr
              v-for="entry in list.items"
              :key="entry.id"
              class="border-t border-slate-100 dark:border-slate-700"
            >
              <td class="py-2">
                <button
                  type="button"
                  class="font-medium hover:text-purple-600"
                  @click="selectedUserId = entry.id"
                >
                  {{ entry.username }}
                </button>
              </td>
              <td class="py-2 text-right text-slate-500 tabular-nums">
                {{ entry.xp.toLocaleString('fr-FR') }} XP
              </td>
              <td class="py-2 text-right font-black tabular-nums w-12">{{ entry.trustIndex }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- Détail d'un utilisateur -->
    <Teleport to="body">
      <div
        v-if="selectedUserId"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="selectedUserId = null"
      >
        <div
          class="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold">Détail de l'indice de confiance</h3>
            <NuxtLink
              :to="ROUTES.USER_PROFILE(selectedUserId)"
              class="text-xs font-bold text-purple-600 hover:underline"
            >
              Voir le profil
            </NuxtLink>
          </div>
          <TrustBreakdownPanel :user-id="selectedUserId" />
          <div class="flex justify-end">
            <button
              type="button"
              class="px-4 py-2 text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              @click="selectedUserId = null"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
