<script setup lang="ts">
import type { Tip } from '~/types';

definePageMeta({
  middleware: 'auth',
});

const TipsCard = defineAsyncComponent(() => import('~/components/TipsCard.vue'));
const { user } = useAuth();

const api = useApi();
const myTips = ref<Tip[]>([]);

try {
  myTips.value = await api.get<Tip[]>('/users/me/tips');
} catch (e) {
  myTips.value = [];
}

const pendingTips = computed(() => myTips.value.filter((tip) => tip.status === 'PENDING'));
const approvedTips = computed(() => myTips.value.filter((tip) => tip.status === 'APPROVED'));
const rejectedTips = computed(() => myTips.value.filter((tip) => tip.status === 'REJECTED'));

useSeoMeta({
  title: 'Mes Tips - AideFlash',
  description: 'Gérez tous vos tips publiés sur AideFlash.',
});
</script>

<template>
  <div class="min-h-screen py-12 px-4 max-w-7xl mx-auto space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div>
        <h1 class="text-4xl font-black text-slate-900 dark:text-white mb-2">
          Mes
          <span class="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-500"
            >Tips</span
          >
        </h1>
        <p class="text-gray-500 dark:text-gray-400">Gérez et consultez tous vos tips publiés.</p>
      </div>

      <!-- Bouton créer un tip -->
      <NuxtLink
        to="/tips/create"
        class="px-6 py-3 text-sm font-bold text-white bg-linear-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
      >
        <Icon name="tabler:plus" class="w-5 h-5" />
        Créer un tip
      </NuxtLink>
    </div>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        class="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/20 dark:border-slate-700 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"
          >
            <Icon name="tabler:clock" class="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p class="text-3xl font-black text-slate-900 dark:text-white">
              {{ pendingTips.length }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">En attente</p>
          </div>
        </div>
      </div>

      <div
        class="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/20 dark:border-slate-700 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <Icon name="tabler:check" class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-3xl font-black text-slate-900 dark:text-white">
              {{ approvedTips.length }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Approuvés</p>
          </div>
        </div>
      </div>

      <div
        class="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/20 dark:border-slate-700 shadow-lg"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <Icon name="tabler:x" class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p class="text-3xl font-black text-slate-900 dark:text-white">
              {{ rejectedTips.length }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Refusés</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des tips -->
    <div v-if="myTips.length > 0" class="space-y-6">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Tous mes tips</h2>
      <div class="grid gap-6">
        <TipsCard v-for="tip in myTips" :key="tip.id" :tip="tip" />
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="text-center py-20">
      <div
        class="bg-gray-100 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <Icon name="tabler:file-text" class="w-10 h-10 text-gray-400" />
      </div>
      <h3 class="text-xl font-bold text-slate-700 dark:text-slate-200">Aucun tip pour l'instant</h3>
      <p class="text-gray-500 mb-6">Commencez à partager vos connaissances !</p>
      <NuxtLink
        to="/tips/create"
        class="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-linear-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition"
      >
        <Icon name="tabler:plus" class="w-5 h-5" />
        Créer mon premier tip
      </NuxtLink>
    </div>
  </div>
</template>
