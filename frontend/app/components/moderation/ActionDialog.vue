<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Fenêtre de confirmation avec motif obligatoire (et durée en jours si besoin)
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    // none : pas de durée ; optional : vide = définitif ; required : durée obligatoire
    duration?: 'none' | 'optional' | 'required';
    minReasonLength?: number;
    danger?: boolean;
    loading?: boolean;
  }>(),
  {
    description: '',
    confirmLabel: 'Confirmer',
    duration: 'none',
    minReasonLength: 5,
    danger: false,
    loading: false,
  },
);

const emit = defineEmits<{
  (e: 'confirm', payload: { reason: string; days?: number }): void;
  (e: 'close'): void;
}>();

const reason = ref('');
const days = ref<number | null>(null);

watch(
  () => props.open,
  (open) => {
    if (open) {
      reason.value = '';
      days.value = props.duration === 'required' ? 7 : null;
    }
  },
);

const isValid = computed(() => {
  if (reason.value.trim().length < props.minReasonLength) return false;
  if (props.duration === 'required' && !(days.value && days.value > 0)) return false;
  return true;
});

const confirm = () => {
  if (!isValid.value || props.loading) return;
  emit('confirm', {
    reason: reason.value.trim(),
    days: props.duration !== 'none' && days.value ? Number(days.value) : undefined,
  });
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ title }}</h3>
          <p v-if="description" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ description }}
          </p>
        </div>

        <slot />

        <div v-if="duration !== 'none'">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Durée (jours){{ duration === 'optional' ? ' — vide = définitif' : '' }}
          </label>
          <input
            v-model.number="days"
            type="number"
            min="1"
            max="3650"
            class="w-32 p-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Motif
          </label>
          <textarea
            v-model="reason"
            rows="3"
            maxlength="1000"
            class="w-full p-3 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="Expliquez la raison…"
          />
          <p v-if="reason.trim().length < minReasonLength" class="text-xs text-gray-400 mt-1">
            {{ minReasonLength }} caractères minimum
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            @click="emit('close')"
          >
            Annuler
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            :class="danger ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'"
            :disabled="!isValid || loading"
            @click="confirm"
          >
            {{ loading ? 'Envoi…' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
