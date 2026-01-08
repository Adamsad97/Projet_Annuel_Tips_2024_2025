<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RankingUser, CurrentUser } from '~/types';

definePageMeta({
  middleware: 'auth',
});

const RankingFilters = defineAsyncComponent(() => import('~/components/RankingFilters.vue'));
const RankingPodium = defineAsyncComponent(() => import('~/components/RankingPodium.vue'));
const RankingTable = defineAsyncComponent(() => import('~/components/RankingTable.vue'));
const UserProgressBar = defineAsyncComponent(() => import('~/components/UserProgressBar.vue'));

const { user } = useAuth();
const api = useApi();

const leaderboardData = ref<
  Array<{
    userId: number;
    username: string;
    xp: number;
    rank: number;
    avatarProfile?: string;
    role?: string;
    tips?: number;
    votes?: number;
  }>
>([]);

onMounted(async () => {
  try {
    console.log('[Ranking] Loading leaderboard data...');

    const leaderboardResponse = await api.get<
      Array<{
        userId: number;
        username: string;
        xp: number;
        rank: number;
        avatarProfile?: string;
        role?: string;
        tips?: number;
        votes?: number;
      }>
    >('/users/leaderboard?take=100');

    console.log('[Ranking] Leaderboard response:', {
      isArray: Array.isArray(leaderboardResponse),
      dataLength: leaderboardResponse?.length,
    });

    leaderboardData.value = leaderboardResponse;

    console.log('[Ranking] Loading user progress...');

    const progressResponse = await api.get<{
      currentXp: number;
      currentGrade: { name: string };
      nextGrade: { name: string; xpRequired: number } | null;
      xpToNextGrade: number;
      progressPercent: number;
      weeklyXp?: number;
    }>('/users/me/progress');

    console.log('[Ranking] User progress response:', {
      hasData: !!progressResponse,
      currentXp: progressResponse?.currentXp,
    });

    userProgressData.value = progressResponse;

    console.log('[Ranking] Data loaded. Users count:', leaderboardData.value.length);
  } catch (err) {
    console.error('[Ranking] Failed to load ranking data:', err);
  }
});

const users = computed(() =>
  leaderboardData.value.map((u) => ({
    id: u.userId,
    name: u.username,
    xp: u.xp,
    rank: u.rank,
    avatar: u.avatarProfile || '',
    role: u.role || 'Membre',
    tips: u.tips || 0,
    votes: u.votes || 0,
  })),
);

interface UserProgress {
  currentXp: number;
  currentGrade: { name: string };
  nextGrade: { name: string; xpRequired: number } | null;
  xpToNextGrade: number;
  progressPercent: number;
  weeklyXp?: number;
}

const userProgressData = ref<UserProgress | null>(null);

const userProgress = computed(() => userProgressData.value);

const currentUser = computed<CurrentUser>(() => {
  if (!user.value || !userProgress.value) {
    return {
      id: 0,
      rank: 0,
      name: 'Chargement...',
      xp: 0,
      avatar: '',
      role: '',
      trend: '+0',
    };
  }

  const userRank = users.value.findIndex((u) => u.id === user.value.id) + 1 || 0;

  return {
    id: user.value.id,
    rank: userRank,
    name: `${user.value.firstname || user.value.username}`,
    xp: user.value.xp || 0,
    avatar: user.value.avatar || user.value.avatarProfile || '',
    role: userProgress.value.currentGrade?.name || 'Débutant',
    trend: `+${userProgress.value.weeklyXp || 0}`,
  };
});

const timeFilter = ref<'week' | 'month' | 'all'>('all');
const categoryFilter = ref<'xp' | 'tips' | 'votes'>('xp');

const sortedUsers = computed(() => {
  const list = [...users.value];
  return list;
});

const top1 = computed<RankingUser>(
  () =>
    sortedUsers.value[0] ?? {
      id: 0,
      name: 'N/A',
      xp: 0,
      rank: 0,
      avatar: '',
      role: 'Membre',
      tips: 0,
      votes: 0,
    },
);

const top2 = computed<RankingUser | undefined>(() => sortedUsers.value[1] ?? undefined);
const top3 = computed<RankingUser | undefined>(() => sortedUsers.value[2] ?? undefined);

const restOfRanking = computed<RankingUser[]>(() => sortedUsers.value.slice(3));

const getStatLabel = (): string => {
  const labels: Record<string, string> = {
    xp: 'XP',
    tips: 'Tips',
    votes: 'Votes',
  };
  return labels[categoryFilter.value] || 'XP';
};

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
