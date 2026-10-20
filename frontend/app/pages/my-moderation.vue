<script setup lang="ts">
import { ref } from 'vue';
import type { MyModerationAction } from '~/types';
import { ACTION_LABELS } from '~/types';
import ActionDialog from '~/components/moderation/ActionDialog.vue';
import { API_ROUTES } from '~/config/api';

definePageMeta({
  middleware: 'auth',
});

useSeoMeta({ title: 'Mes sanctions' });

const api = useApi();

const actions = ref<MyModerationAction[]>([]);
const loading = ref(true);
const contested = ref<MyModerationAction | null>(null);
const submitting = ref(false);

const APPEAL_STATUS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Contestation en cours d’examen', color: 'bg-amber-500/10 text-amber-600' },
  ACCEPTED: { label: 'Contestation acceptée', color: 'bg-green-500/10 text-green-600' },
  REJECTED: { label: 'Contestation refusée', color: 'bg-red-500/10 text-red-600' },
};

const loadActions = async () => {
  try {
    actions.value = await api.get<MyModerationAction[]>(API_ROUTES.APPEALS.MINE);
  } catch {
    actions.value = [];
  } finally {
    loading.value = false;
  }
};

const submitAppeal = async ({ reason }: { reason: string }) => {
  if (!contested.value) return;

  submitting.value = true;
  try {
    await api.post(
      API_ROUTES.APPEALS.CREATE(contested.value.id),
      { reason },
      {
        showSuccessToast: true,
        successMessage: 'Contestation envoyée, un administrateur va l’examiner',
      },
    );
    contested.value = null;
    await loadActions();
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    submitting.value = false;
  }
};

onMounted(loadActions);
</script>

<template>
  <div class="max-w-3xl mx-auto py-10 px-4 space-y-6">
    <div>
      <h1 class="text-3xl font-black text-slate-900 dark:text-white">Mes sanctions</h1>
      <p class="text-slate-500 mt-1">
        Avertissements et décisions de modération vous concernant. Si une décision vous semble
        injuste, vous pouvez la contester : un administrateur l'examinera.
      </p>
    </div>

    <p v-if="loading" class="text-slate-400">Chargement…</p>

    <div
      v-else-if="actions.length === 0"
      class="rounded-3xl bg-white/60 dark:bg-slate-900/60 p-10 text-center text-slate-500"
    >
      <Icon name="tabler:mood-happy" class="w-12 h-12 mx-auto mb-2 text-emerald-500" />
      Aucune sanction, continuez comme ça !
    </div>

    <ul v-else class="space-y-4">
      <li
        v-for="action in actions"
        :key="action.id"
        class="rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-white/50 dark:border-white/10 p-5 shadow-sm space-y-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 dark:text-white">
              {{ ACTION_LABELS[action.actionType] ?? action.actionType }}
            </span>
            <span
              v-if="action.overturnedAt"
              class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-green-500/10 text-green-600"
            >
              Annulée
            </span>
          </div>
          <span class="text-xs text-slate-400">
            {{ new Date(action.createdAt).toLocaleDateString('fr-FR') }}
          </span>
        </div>

        <p v-if="action.reason" class="text-sm text-slate-600 dark:text-slate-300">
          Motif : {{ action.reason }}
        </p>

        <div v-if="action.appeal" class="space-y-1">
          <span
            class="inline-block px-2 py-0.5 rounded text-xs font-bold"
            :class="APPEAL_STATUS[action.appeal.status]?.color"
          >
            {{ APPEAL_STATUS[action.appeal.status]?.label }}
          </span>
          <p v-if="action.appeal.response" class="text-sm text-slate-500">
            Réponse de l'administrateur : {{ action.appeal.response }}
          </p>
        </div>

        <button
          v-else-if="action.canAppeal"
          type="button"
          class="text-sm font-bold text-purple-600 hover:underline"
          @click="contested = action"
        >
          Contester cette décision
        </button>
      </li>
    </ul>

    <ActionDialog
      :open="!!contested"
      title="Contester la décision"
      description="Expliquez pourquoi cette décision vous semble injustifiée. Les contestations abusives et répétées peuvent jouer en votre défaveur."
      confirm-label="Envoyer la contestation"
      :min-reason-length="10"
      :loading="submitting"
      @confirm="submitAppeal"
      @close="contested = null"
    />
  </div>
</template>
