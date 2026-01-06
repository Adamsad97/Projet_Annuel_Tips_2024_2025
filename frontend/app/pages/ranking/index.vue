<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RankingUser, CurrentUser } from '~/types';

definePageMeta({
  middleware: 'auth',
});

// Composants lazy-loaded (chemins locaux)
const RankingFilters = defineAsyncComponent(() => import('~/components/RankingFilters.vue'));
const RankingPodium = defineAsyncComponent(() => import('~/components/RankingPodium.vue'));
const RankingTable = defineAsyncComponent(() => import('~/components/RankingTable.vue'));
const UserProgressBar = defineAsyncComponent(() => import('~/components/UserProgressBar.vue'));

// Données mockées
const currentUser: CurrentUser = {
  id: 99,
  rank: 42,
  name: 'Toi (Louis)',
  xp: 665,
  avatar: 'https://i.pravatar.cc/150?u=99',
  role: 'Explorateur',
  trend: '+12',
};

const { data: fetchedUsers } = await useFetch<User[]>('/api/users');
const users = computed(() => fetchedUsers.value || []);

// État
const timeFilter = ref<'week' | 'month' | 'all'>('all');
const categoryFilter = ref<'xp' | 'tips' | 'votes'>('xp');

// Computed - Gestion des undefined
const sortedUsers = computed(() => {
  const list = [...users.value];
  switch (categoryFilter.value) {
    case 'tips':
      return list.sort((a, b) => b.tips - a.tips);
    case 'votes':
      return list.sort((a, b) => b.votes - a.votes);
    default:
      return list.sort((a, b) => b.xp - a.xp);
  }
});

const top1 = computed<User>(
  () =>
    sortedUsers.value[0] ?? {
      id: 0,
      name: 'N/A',
      xp: 0,
      tips: 0,
      votes: 0,
      role: 'Inconnu',
      avatar: '/placeholder.svg',
    },
);

const top2 = computed<User | undefined>(() => sortedUsers.value[1] ?? undefined);
const top3 = computed<User | undefined>(() => sortedUsers.value[2] ?? undefined);

const restOfRanking = computed<User[]>(() => sortedUsers.value.slice(3));

const getStatLabel = (): string => {
  const labels: Record<string, string> = {
    xp: 'XP',
    tips: 'Tips',
    votes: 'Votes',
  };
  return labels[categoryFilter.value] || 'XP';
};

// SEO
useSeoMeta({
  title: 'Classement Elite - AideFlash',
  description:
    'Découvrez le classement des meilleurs contributeurs AideFlash par XP, tips publiés et popularité.',
});
</script>

<template>
  <div class="min-h-screen max-w-7xl mx-auto px-4 py-12 md:px-8 space-y-12">
    <!-- Filtres -->
    <ClientOnly>
      <RankingFilters
        :time-filter="timeFilter"
        :category-filter="categoryFilter"
        @update:time-filter="timeFilter = $event"
        @update:category-filter="categoryFilter = $event"
      />
    </ClientOnly>

    <!-- Podium -->
    <ClientOnly>
      <RankingPodium
        :top1="top1"
        :top2="top2"
        :top3="top3"
        :stat-key="categoryFilter"
        :stat-label="getStatLabel()"
      />
    </ClientOnly>

    <!-- Classement complet -->
    <ClientOnly>
      <RankingTable
        :users="restOfRanking"
        :category-filter="categoryFilter"
        :stat-label="getStatLabel()"
      />
    </ClientOnly>

    <!-- Barre de progression utilisateur -->
    <ClientOnly>
      <UserProgressBar :user="currentUser" />
    </ClientOnly>
  </div>
</template>
