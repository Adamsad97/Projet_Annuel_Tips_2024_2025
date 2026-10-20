<script setup lang="ts">
import { ref, watch } from 'vue';
import type { VoteSummary, VoteValue } from '~/types';
import { ROUTES } from '~/config/routes';

const props = withDefaults(
  defineProps<{
    endpoint: string;
    score: number;
    userVote: VoteValue;
    // Contenu de l'utilisateur courant : on affiche le score sans permettre de voter
    disabled?: boolean;
    size?: 'sm' | 'md';
  }>(),
  { disabled: false, size: 'md' },
);

const emit = defineEmits<{
  (e: 'update', summary: VoteSummary): void;
}>();

const api = useApi();
const route = useRoute();
const { isAuthenticated } = useAuth();

const currentScore = ref(props.score);
const currentVote = ref<VoteValue>(props.userVote);
const loading = ref(false);

watch(
  () => [props.score, props.userVote] as const,
  ([score, userVote]) => {
    currentScore.value = score;
    currentVote.value = userVote;
  },
);

const vote = async (value: 1 | -1) => {
  if (props.disabled || loading.value) return;

  if (!isAuthenticated.value) {
    await navigateTo({ path: ROUTES.LOGIN, query: { redirect: route.fullPath } });
    return;
  }

  const nextValue: VoteValue = currentVote.value === value ? 0 : value;
  loading.value = true;
  try {
    const summary = await api.post<VoteSummary>(props.endpoint, { value: nextValue });
    currentScore.value = summary.score;
    currentVote.value = summary.userVote;
    emit('update', summary);
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    loading.value = false;
  }
};

const iconClass = props.size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
</script>

<template>
  <div
    class="inline-flex items-center gap-1 rounded-xl"
    :class="size === 'md' ? 'bg-white/70 dark:bg-slate-800/70 px-1 py-1 shadow-sm' : ''"
  >
    <button
      type="button"
      class="p-1 rounded-lg transition-colors disabled:cursor-not-allowed"
      :class="
        currentVote === 1
          ? 'text-emerald-500'
          : 'text-gray-400 hover:text-emerald-500 disabled:hover:text-gray-400'
      "
      :disabled="disabled || loading"
      :title="disabled ? 'Vous ne pouvez pas voter pour votre propre contenu' : 'Utile'"
      @click="vote(1)"
    >
      <Icon
        :name="currentVote === 1 ? 'tabler:thumb-up-filled' : 'tabler:thumb-up'"
        :class="iconClass"
      />
    </button>
    <span
      class="min-w-6 text-center font-bold tabular-nums"
      :class="[
        size === 'sm' ? 'text-xs' : 'text-sm',
        currentScore > 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : currentScore < 0
            ? 'text-red-500'
            : 'text-gray-500 dark:text-gray-400',
      ]"
    >
      {{ currentScore }}
    </span>
    <button
      type="button"
      class="p-1 rounded-lg transition-colors disabled:cursor-not-allowed"
      :class="
        currentVote === -1
          ? 'text-red-500'
          : 'text-gray-400 hover:text-red-500 disabled:hover:text-gray-400'
      "
      :disabled="disabled || loading"
      :title="disabled ? 'Vous ne pouvez pas voter pour votre propre contenu' : 'Pas utile'"
      @click="vote(-1)"
    >
      <Icon
        :name="currentVote === -1 ? 'tabler:thumb-down-filled' : 'tabler:thumb-down'"
        :class="iconClass"
      />
    </button>
  </div>
</template>
