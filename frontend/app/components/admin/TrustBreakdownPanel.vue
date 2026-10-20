<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TrustBreakdown } from '~/types';
import { API_ROUTES } from '~/config/api';

// Détail du calcul de l'indice de confiance d'un utilisateur, facteur par facteur
const props = defineProps<{ userId: number }>();

const api = useApi();
const breakdown = ref<TrustBreakdown | null>(null);

const load = async () => {
  breakdown.value = null;
  try {
    breakdown.value = await api.get<TrustBreakdown>(API_ROUTES.ADMIN.USER_TRUST(props.userId));
  } catch {
    breakdown.value = null;
  }
};

watch(() => props.userId, load, { immediate: true });
</script>

<template>
  <div v-if="!breakdown" class="text-sm text-slate-400">Calcul de l'indice…</div>
  <div v-else class="space-y-3">
    <div class="flex items-baseline gap-3">
      <span class="text-3xl font-black text-slate-900 dark:text-white">
        {{ breakdown.trustIndex }}
      </span>
      <span class="text-xs text-slate-500">
        calculé {{ breakdown.computed }}
        <template v-if="breakdown.adjustment">
          · ajustement manuel {{ breakdown.adjustment > 0 ? '+' : '' }}{{ breakdown.adjustment }}
        </template>
      </span>
    </div>
    <table class="w-full text-xs">
      <tbody>
        <tr class="text-slate-500">
          <td class="py-1">Base</td>
          <td />
          <td class="py-1 text-right font-bold">50</td>
        </tr>
        <tr
          v-for="factor in breakdown.factors"
          :key="factor.key"
          class="border-t border-slate-100 dark:border-slate-800"
          :class="{ 'opacity-50': factor.points === 0 }"
        >
          <td class="py-1 pr-2">{{ factor.label }}</td>
          <td class="py-1 pr-2 text-right tabular-nums text-slate-500">{{ factor.value }}</td>
          <td
            class="py-1 text-right font-bold tabular-nums"
            :class="
              factor.points > 0 ? 'text-emerald-600' : factor.points < 0 ? 'text-red-500' : ''
            "
          >
            {{ factor.points > 0 ? '+' : '' }}{{ factor.points }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
