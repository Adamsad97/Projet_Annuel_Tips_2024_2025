<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { AdminUser } from '~/types';
import ActionDialog from '~/components/moderation/ActionDialog.vue';
import TrustBreakdownPanel from '~/components/admin/TrustBreakdownPanel.vue';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

const PAGE_SIZE = 20;

const api = useApi();
const toast = useToastMessage();
const { user: currentUser } = useAuth();

const users = ref<AdminUser[]>([]);
const total = ref(0);
const page = ref(0);
const search = ref('');
// Tri : récents, ou par indice de confiance pour comparer les membres
const sort = ref<'recent' | 'trust-asc' | 'trust-desc'>('recent');
const loading = ref(false);

type DialogKind = 'ban' | 'mute' | 'trust';
const dialog = ref<{ kind: DialogKind; user: AdminUser } | null>(null);
const dialogLoading = ref(false);
const trustValue = ref(50);

const ROLE_LABELS = { USER: 'Membre', MODERATOR: 'Modérateur', ADMIN: 'Admin' } as const;

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

const displayName = (user: AdminUser) =>
  [user.firstname, user.lastname].filter(Boolean).join(' ') || user.username;

const formatDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('fr-FR') : '—';

const loadUsers = async () => {
  loading.value = true;
  try {
    const query = new URLSearchParams({
      skip: String(page.value * PAGE_SIZE),
      take: String(PAGE_SIZE),
      sort: sort.value,
      ...(search.value.trim() ? { q: search.value.trim() } : {}),
    });
    const data = await api.get<{ items: AdminUser[]; total: number }>(
      `${API_ROUTES.ADMIN.USERS}?${query}`,
    );
    users.value = data.items;
    total.value = data.total;
  } catch {
    users.value = [];
  } finally {
    loading.value = false;
  }
};

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 0;
    loadUsers();
  }, 300);
});
watch(page, loadUsers);
watch(sort, () => {
  if (page.value === 0) loadUsers();
  else page.value = 0;
});

// Exécute une action puis recharge la liste ; l'erreur éventuelle est affichée par useApi
const run = async (action: () => Promise<unknown>, successMessage: string) => {
  try {
    await action();
    toast.success(successMessage);
    await loadUsers();
    return true;
  } catch {
    return false;
  }
};

const openDialog = (kind: DialogKind, user: AdminUser) => {
  trustValue.value = user.trustIndex;
  dialog.value = { kind, user };
};

const DIALOGS: Record<
  DialogKind,
  { title: string; confirm: string; duration: 'none' | 'optional' | 'required' }
> = {
  ban: { title: 'Bannir', confirm: 'Bannir', duration: 'optional' },
  mute: { title: 'Interdire de publier', confirm: 'Appliquer', duration: 'required' },
  trust: { title: 'Ajuster l’indice de confiance', confirm: 'Enregistrer', duration: 'none' },
};

const confirmDialog = async ({ reason, days }: { reason: string; days?: number }) => {
  if (!dialog.value) return;
  const { kind, user } = dialog.value;

  dialogLoading.value = true;
  const done = await run(() => {
    if (kind === 'ban') return api.post(API_ROUTES.ADMIN.BAN(user.id), { reason, days });
    if (kind === 'mute') return api.post(API_ROUTES.ADMIN.MUTE(user.id), { reason, days });
    return api.patch(API_ROUTES.ADMIN.TRUST_INDEX(user.id), {
      trustIndex: Number(trustValue.value),
      reason,
    });
  }, 'Action effectuée');
  dialogLoading.value = false;
  if (done) dialog.value = null;
};

const unban = (user: AdminUser) =>
  run(() => api.delete(API_ROUTES.ADMIN.BAN(user.id)), `${user.username} débanni`);

const unmute = (user: AdminUser) =>
  run(() => api.delete(API_ROUTES.ADMIN.MUTE(user.id)), `${user.username} peut de nouveau publier`);

const promote = (user: AdminUser) =>
  run(
    () => api.post(API_ROUTES.MODERATION.PROMOTE, { userId: user.id, role: 'MODERATOR' }),
    `${user.username} est maintenant modérateur`,
  );

const demote = (user: AdminUser) => {
  const reason = prompt(`Motif de la rétrogradation de ${user.username} (10 caractères min.) :`);
  if (!reason || reason.trim().length < 10) return;
  return run(
    () => api.post(API_ROUTES.MODERATION.DEMOTE, { userId: user.id, reason: reason.trim() }),
    `${user.username} n'est plus modérateur`,
  );
};

const resetUser = (user: AdminUser) => {
  if (!confirm(`Réinitialiser la progression de ${user.username} (XP, grade, badges, indice) ?`))
    return;
  return run(() => api.post(API_ROUTES.ADMIN.RESET(user.id)), 'Progression réinitialisée');
};

const deleteUser = (user: AdminUser) => {
  if (!confirm(`Supprimer définitivement le compte de ${user.username} et tout son contenu ?`))
    return;
  return run(() => api.delete(API_ROUTES.ADMIN.USER(user.id)), 'Compte supprimé');
};

onMounted(loadUsers);
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="Rechercher (pseudo, email, nom)…"
        class="w-full sm:w-80 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
      />
      <div class="flex items-center gap-3">
        <select
          v-model="sort"
          class="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
        >
          <option value="recent">Plus récents</option>
          <option value="trust-desc">Indice de confiance décroissant</option>
          <option value="trust-asc">Indice de confiance croissant</option>
        </select>
        <span class="text-sm text-slate-500">{{ total }} utilisateur(s)</span>
      </div>
    </div>

    <div class="overflow-x-auto rounded-2xl bg-white/70 dark:bg-slate-800/60">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-slate-500 uppercase">
            <th class="p-3">Membre</th>
            <th class="p-3">Rôle</th>
            <th class="p-3 text-right">XP</th>
            <th
              class="p-3 text-right"
              title="Indice de confiance (visible uniquement par les admins)"
            >
              Confiance
            </th>
            <th class="p-3">Dernière connexion</th>
            <th class="p-3">Statut</th>
            <th class="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="p-6 text-center text-slate-400">Chargement…</td>
          </tr>
          <tr
            v-for="user in users"
            v-else
            :key="user.id"
            class="border-t border-slate-100 dark:border-slate-700 align-top"
          >
            <td class="p-3">
              <NuxtLink
                :to="ROUTES.USER_PROFILE(user.id)"
                class="font-bold text-slate-800 dark:text-slate-100 hover:text-purple-600"
              >
                {{ displayName(user) }}
              </NuxtLink>
              <div class="text-xs text-slate-500">@{{ user.username }} · {{ user.email }}</div>
              <div class="text-xs text-slate-400">
                {{ user._count.tips }} tips · {{ user._count.comments }} commentaires
              </div>
            </td>
            <td class="p-3">{{ ROLE_LABELS[user.role] }}</td>
            <td class="p-3 text-right tabular-nums">
              {{ user.xp.toLocaleString('fr-FR') }}
              <div class="text-xs text-slate-400">{{ user.grade?.name }}</div>
            </td>
            <td class="p-3 text-right tabular-nums font-bold">{{ user.trustIndex }}</td>
            <td class="p-3 text-slate-500">{{ formatDate(user.lastLoginAt) }}</td>
            <td class="p-3 space-y-1">
              <span
                v-if="user.isBanned"
                class="block w-fit px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-600"
                :title="user.banReason ?? ''"
              >
                Banni {{ user.bannedUntil ? `→ ${formatDate(user.bannedUntil)}` : '(définitif)' }}
              </span>
              <span
                v-if="user.isMuted"
                class="block w-fit px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-600"
              >
                Muet → {{ formatDate(user.mutedUntil) }}
              </span>
              <span v-if="!user.isBanned && !user.isMuted" class="text-xs text-emerald-600">
                Actif
              </span>
            </td>
            <td class="p-3">
              <div
                v-if="user.role !== 'ADMIN' && user.id !== currentUser?.id"
                class="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs font-bold"
              >
                <button
                  v-if="user.isBanned"
                  class="text-emerald-600 hover:underline"
                  @click="unban(user)"
                >
                  Débannir
                </button>
                <button
                  v-else
                  class="text-red-500 hover:underline"
                  @click="openDialog('ban', user)"
                >
                  Bannir
                </button>
                <button
                  v-if="user.isMuted"
                  class="text-emerald-600 hover:underline"
                  @click="unmute(user)"
                >
                  Rendre la parole
                </button>
                <button
                  v-else
                  class="text-amber-600 hover:underline"
                  @click="openDialog('mute', user)"
                >
                  Muter
                </button>
                <button
                  v-if="user.role === 'USER'"
                  class="text-purple-600 hover:underline"
                  @click="promote(user)"
                >
                  Promouvoir modérateur
                </button>
                <button v-else class="text-purple-600 hover:underline" @click="demote(user)">
                  Retirer modérateur
                </button>
                <button
                  class="text-slate-600 dark:text-slate-300 hover:underline"
                  @click="openDialog('trust', user)"
                >
                  Confiance
                </button>
                <button
                  class="text-slate-600 dark:text-slate-300 hover:underline"
                  @click="resetUser(user)"
                >
                  Réinitialiser
                </button>
                <button class="text-red-600 hover:underline" @click="deleteUser(user)">
                  Supprimer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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

    <ActionDialog
      :open="!!dialog"
      :title="dialog ? `${DIALOGS[dialog.kind].title} ${dialog.user.username}` : ''"
      :confirm-label="dialog ? DIALOGS[dialog.kind].confirm : ''"
      :duration="dialog ? DIALOGS[dialog.kind].duration : 'none'"
      :loading="dialogLoading"
      :danger="dialog?.kind !== 'trust'"
      @confirm="confirmDialog"
      @close="dialog = null"
    >
      <div v-if="dialog?.kind === 'trust'" class="space-y-4">
        <TrustBreakdownPanel :user-id="dialog.user.id" />
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Nouvel indice (0 à 100) — conservé lors des recalculs automatiques
        </label>
        <input v-model.number="trustValue" type="range" min="0" max="100" class="w-full" />
        <div class="text-center font-black text-2xl">{{ trustValue }}</div>
      </div>
    </ActionDialog>
  </div>
</template>
