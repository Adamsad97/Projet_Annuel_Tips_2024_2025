<script setup lang="ts">
import { ref, computed } from 'vue';
import { ROUTES } from '~/config/routes';

const props = withDefaults(
  defineProps<{
    endpoint: string;
    // Libellé du contenu signalé, affiché dans la fenêtre ("ce tip", "ce commentaire")
    target?: string;
    compact?: boolean;
  }>(),
  { target: 'ce contenu', compact: false },
);

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

const api = useApi();
const route = useRoute();
const { isAuthenticated } = useAuth();

const isOpen = ref(false);
const reason = ref('');
const submitting = ref(false);
const reported = ref(false);

const canSubmit = computed(
  () => reason.value.trim().length >= MIN_REASON_LENGTH && !submitting.value,
);

const open = async () => {
  if (!isAuthenticated.value) {
    await navigateTo({ path: ROUTES.LOGIN, query: { redirect: route.fullPath } });
    return;
  }
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
  reason.value = '';
};

const submit = async () => {
  if (!canSubmit.value) return;

  submitting.value = true;
  try {
    await api.post(
      props.endpoint,
      { reason: reason.value.trim() },
      {
        showSuccessToast: true,
        successMessage: 'Signalement envoyé, merci ! Un modérateur va l’examiner.',
      },
    );
    reported.value = true;
    close();
  } catch {
    // l'erreur (ex: déjà signalé) est déjà affichée par useApi
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :class="
      compact
        ? 'text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500'
        : 'px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300 hover:text-red-600 border border-slate-300 dark:border-slate-600 font-medium text-sm'
    "
    :disabled="reported"
    :title="reported ? 'Déjà signalé' : `Signaler ${target}`"
    @click="open"
  >
    <Icon name="tabler:flag" class="w-4 h-4" />
    {{ reported ? 'Signalé' : 'Signaler' }}
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="close"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
        role="dialog"
        aria-modal="true"
      >
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">Signaler {{ target }}</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Expliquez en quelques mots pourquoi ce contenu est inapproprié.
        </p>
        <textarea
          v-model="reason"
          rows="4"
          :maxlength="MAX_REASON_LENGTH"
          class="w-full p-3 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-red-500 outline-none"
          placeholder="Ex : contenu trompeur, spam, propos offensants…"
        />
        <div class="flex items-center justify-between mt-1 text-xs text-gray-400">
          <span v-if="reason.trim().length < MIN_REASON_LENGTH">
            {{ MIN_REASON_LENGTH }} caractères minimum
          </span>
          <span v-else />
          <span>{{ reason.length }}/{{ MAX_REASON_LENGTH }}</span>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            @click="close"
          >
            Annuler
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!canSubmit"
            @click="submit"
          >
            {{ submitting ? 'Envoi…' : 'Envoyer le signalement' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
