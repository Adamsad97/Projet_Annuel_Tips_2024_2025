<script setup lang="ts">
import { ref } from 'vue';
import type { AdminFeatureFlag } from '~/types';
import { API_ROUTES } from '~/config/api';

const api = useApi();
const toast = useToastMessage();
const { loadFeatures } = useFeatures();

const flags = ref<AdminFeatureFlag[]>([]);
const saving = ref<string | null>(null);

const load = async () => {
  try {
    flags.value = await api.get<AdminFeatureFlag[]>(API_ROUTES.ADMIN.FEATURES);
  } catch {
    flags.value = [];
  }
};

const save = async (flag: AdminFeatureFlag, changes: Partial<AdminFeatureFlag>) => {
  saving.value = flag.key;
  try {
    await api.patch(API_ROUTES.ADMIN.FEATURE(flag.key), {
      enabled: changes.enabled ?? flag.enabled,
      rolloutPercentage: Number(changes.rolloutPercentage ?? flag.rolloutPercentage),
    });
    toast.success('Fonctionnalité mise à jour');
    await load();
    // L'admin voit immédiatement l'effet sur sa propre session
    await loadFeatures();
  } catch {
    await load();
  } finally {
    saving.value = null;
  }
};

onMounted(load);
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
      Activez ou désactivez les fonctionnalités expérimentales, ou ne les montrez qu'à une partie
      des membres pour un test A/B. Un membre reste toujours dans le même groupe tant que le
      pourcentage ne change pas. Les visiteurs non connectés ne voient une fonctionnalité que si
      elle est déployée à 100 %.
    </p>

    <ul class="space-y-3">
      <li
        v-for="flag in flags"
        :key="flag.key"
        class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5 space-y-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="font-bold text-slate-900 dark:text-white font-mono">{{ flag.key }}</div>
            <p class="text-sm text-slate-500">{{ flag.description }}</p>
          </div>
          <label class="inline-flex items-center gap-2 text-sm font-bold cursor-pointer">
            <input
              type="checkbox"
              :checked="flag.enabled"
              :disabled="saving === flag.key"
              @change="save(flag, { enabled: !flag.enabled })"
            />
            {{ flag.enabled ? 'Activée' : 'Désactivée' }}
          </label>
        </div>

        <div v-if="flag.enabled" class="space-y-1">
          <div class="flex items-center gap-3">
            <input
              v-model.number="flag.rolloutPercentage"
              type="range"
              min="0"
              max="100"
              step="5"
              class="flex-1"
              :aria-label="`Pourcentage de membres exposés à ${flag.key}`"
              @change="save(flag, { rolloutPercentage: flag.rolloutPercentage })"
            />
            <span class="w-14 text-right font-black tabular-nums"
              >{{ flag.rolloutPercentage }} %</span
            >
          </div>
          <p class="text-xs text-slate-500">
            Groupe exposé : {{ flag.exposedUsers }} membre(s) sur {{ flag.totalUsers }}
            <template v-if="flag.rolloutPercentage < 100">
              — les autres forment le groupe témoin
            </template>
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
