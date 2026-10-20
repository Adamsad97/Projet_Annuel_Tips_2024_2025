<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ErrorLogEntry } from '~/types';
import { API_ROUTES } from '~/config/api';

const PAGE_SIZE = 50;

const api = useApi();
const toast = useToastMessage();

const logs = ref<ErrorLogEntry[]>([]);
const total = ref(0);
const last24h = ref(0);
const source = ref<'' | 'server' | 'client'>('');
const search = ref('');
const page = ref(0);
const expanded = ref<number | null>(null);
const loading = ref(false);

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

const loadLogs = async () => {
  loading.value = true;
  try {
    const query = new URLSearchParams({
      skip: String(page.value * PAGE_SIZE),
      take: String(PAGE_SIZE),
      ...(source.value ? { source: source.value } : {}),
      ...(search.value.trim() ? { q: search.value.trim() } : {}),
    });
    const data = await api.get<{ items: ErrorLogEntry[]; total: number; last24h: number }>(
      `${API_ROUTES.ADMIN.LOGS}?${query}`,
    );
    logs.value = data.items;
    total.value = data.total;
    last24h.value = data.last24h;
  } catch {
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

const purge = async (olderThanDays: number) => {
  const label =
    olderThanDays === 0 ? 'toutes les erreurs' : `les erreurs de plus de ${olderThanDays} jours`;
  if (!confirm(`Supprimer ${label} ?`)) return;

  try {
    const { deleted } = await api.delete<{ deleted: number }>(
      `${API_ROUTES.ADMIN.LOGS}?olderThanDays=${olderThanDays}`,
    );
    toast.success(`${deleted} erreur(s) supprimée(s)`);
    page.value = 0;
    await loadLogs();
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 0;
    loadLogs();
  }, 300);
});
watch(source, () => {
  page.value = 0;
  loadLogs();
});
watch(page, loadLogs);
onMounted(loadLogs);
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="source"
          class="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
        >
          <option value="">Toutes les sources</option>
          <option value="server">Serveur (API)</option>
          <option value="client">Navigateur (frontend)</option>
        </select>
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher (message, route)…"
          class="w-64 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-purple-500"
        />
        <span class="text-sm text-slate-500">
          {{ total }} erreur(s) · {{ last24h }} sur les dernières 24 h
        </span>
      </div>
      <div class="flex gap-3 text-xs font-bold">
        <button class="text-slate-600 dark:text-slate-300 hover:underline" @click="purge(30)">
          Purger &gt; 30 jours
        </button>
        <button class="text-red-500 hover:underline" @click="purge(0)">Tout supprimer</button>
      </div>
    </div>

    <p v-if="loading" class="text-slate-400">Chargement…</p>
    <p v-else-if="logs.length === 0" class="text-slate-500">Aucune erreur enregistrée. 🎉</p>

    <ul v-else class="space-y-2">
      <li
        v-for="log in logs"
        :key="log.id"
        class="rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/50 dark:border-white/5"
      >
        <button
          type="button"
          class="w-full text-left px-4 py-3 flex flex-wrap items-center gap-3"
          @click="expanded = expanded === log.id ? null : log.id"
        >
          <span
            class="px-2 py-0.5 rounded text-[10px] font-black uppercase"
            :class="
              log.source === 'server'
                ? 'bg-red-500/10 text-red-600'
                : 'bg-amber-500/10 text-amber-600'
            "
          >
            {{ log.source === 'server' ? 'API' : 'Front' }}
          </span>
          <span
            class="flex-1 min-w-0 font-medium text-sm text-slate-800 dark:text-slate-100 truncate"
          >
            {{ log.message }}
          </span>
          <span class="text-xs text-slate-500 font-mono"> {{ log.method }} {{ log.path }} </span>
          <span class="text-xs text-slate-400">
            {{ new Date(log.createdAt).toLocaleString('fr-FR') }}
          </span>
        </button>
        <div v-if="expanded === log.id" class="px-4 pb-4 space-y-2 text-xs">
          <p class="text-slate-500">
            Utilisateur : {{ log.userId ?? 'non connecté' }}
            <template v-if="log.statusCode"> · statut {{ log.statusCode }}</template>
          </p>
          <pre
            v-if="log.stack"
            class="overflow-x-auto p-3 rounded-lg bg-slate-900 text-slate-100 whitespace-pre"
            >{{ log.stack }}</pre
          >
          <pre
            v-if="log.context"
            class="overflow-x-auto p-3 rounded-lg bg-slate-100 dark:bg-slate-900"
            >{{ JSON.stringify(log.context, null, 2) }}</pre
          >
        </div>
      </li>
    </ul>

    <div v-if="pageCount > 1" class="flex justify-center items-center gap-3 text-sm">
      <button
        class="px-3 py-1 rounded-lg border disabled:opacity-40"
        :disabled="page === 0"
        @click="page--"
      >
        Précédent
      </button>
      <span>Page {{ page + 1 }} / {{ pageCount }}</span>
      <button
        class="px-3 py-1 rounded-lg border disabled:opacity-40"
        :disabled="page + 1 >= pageCount"
        @click="page++"
      >
        Suivant
      </button>
    </div>
  </div>
</template>
