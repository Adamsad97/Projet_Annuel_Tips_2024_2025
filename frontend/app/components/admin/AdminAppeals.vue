<script setup lang="ts">
import { ref, watch } from 'vue';
import type { AdminAppeal } from '~/types';
import { ACTION_LABELS } from '~/types';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

const api = useApi();

const appeals = ref<AdminAppeal[]>([]);
const showAll = ref(false);
const loading = ref(false);
const responses = ref<Record<number, string>>({});
const resolving = ref<number | null>(null);

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
};

const loadAppeals = async () => {
  loading.value = true;
  try {
    appeals.value = await api.get<AdminAppeal[]>(
      `${API_ROUTES.ADMIN.APPEALS}${showAll.value ? '?status=all' : ''}`,
    );
  } catch {
    appeals.value = [];
  } finally {
    loading.value = false;
  }
};

const resolve = async (appeal: AdminAppeal, decision: 'ACCEPTED' | 'REJECTED') => {
  const message =
    decision === 'ACCEPTED'
      ? 'Accepter la contestation ? La sanction sera annulée.'
      : 'Refuser la contestation ? La sanction est maintenue.';
  if (!confirm(message)) return;

  resolving.value = appeal.id;
  try {
    await api.post(
      API_ROUTES.ADMIN.RESOLVE_APPEAL(appeal.id),
      { decision, response: responses.value[appeal.id]?.trim() || undefined },
      { showSuccessToast: true, successMessage: 'Contestation traitée' },
    );
    await loadAppeals();
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    resolving.value = null;
  }
};

watch(showAll, loadAppeals);
onMounted(loadAppeals);
</script>

<template>
  <div class="space-y-4">
    <label class="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <input v-model="showAll" type="checkbox" /> Afficher aussi les contestations traitées
    </label>

    <p v-if="loading" class="text-slate-400">Chargement…</p>
    <p v-else-if="appeals.length === 0" class="text-slate-500">Aucune contestation.</p>

    <ul v-else class="space-y-4">
      <li
        v-for="appeal in appeals"
        :key="appeal.id"
        class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5 space-y-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="font-bold text-slate-900 dark:text-white">
            {{ ACTION_LABELS[appeal.action.actionType] ?? appeal.action.actionType }}
            <span class="font-normal text-slate-500">
              contre
              <NuxtLink :to="ROUTES.USER_PROFILE(appeal.user.id)" class="hover:text-purple-600">
                {{ appeal.user.username }}
              </NuxtLink>
              par {{ appeal.action.moderator.username }}
            </span>
          </div>
          <span class="text-xs font-bold px-2 py-0.5 rounded bg-slate-500/10">
            {{ STATUS_LABELS[appeal.status] }}
          </span>
        </div>

        <p class="text-sm text-slate-600 dark:text-slate-300">
          <strong>Motif de la sanction :</strong> {{ appeal.action.reason || '—' }}
          <span class="text-xs text-slate-400">
            ({{ new Date(appeal.action.createdAt).toLocaleDateString('fr-FR') }})
          </span>
        </p>
        <p class="text-sm text-slate-600 dark:text-slate-300">
          <strong>Contestation :</strong> {{ appeal.reason }}
        </p>

        <template v-if="appeal.status === 'OPEN'">
          <textarea
            v-model="responses[appeal.id]"
            rows="2"
            maxlength="500"
            placeholder="Réponse à l'utilisateur (optionnelle)"
            class="w-full p-3 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
              :disabled="resolving === appeal.id"
              @click="resolve(appeal, 'ACCEPTED')"
            >
              Accepter (annuler la sanction)
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50"
              :disabled="resolving === appeal.id"
              @click="resolve(appeal, 'REJECTED')"
            >
              Refuser
            </button>
          </div>
        </template>
        <p v-else-if="appeal.response" class="text-sm text-slate-500">
          Réponse de {{ appeal.resolvedBy?.username }} : {{ appeal.response }}
        </p>
      </li>
    </ul>
  </div>
</template>
