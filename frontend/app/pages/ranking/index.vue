<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RankingUser, CurrentUser } from '~/types';
import { API_ROUTES } from '~/config/api';

definePageMeta({
  middleware: 'auth',
});

const RankingFilters = defineAsyncComponent(() => import('~/components/RankingFilters.vue'));
const RankingPodium = defineAsyncComponent(() => import('~/components/RankingPodium.vue'));
const RankingTable = defineAsyncComponent(() => import('~/components/RankingTable.vue'));
const UserProgressBar = defineAsyncComponent(() => import('~/components/UserProgressBar.vue'));

type RankingSort = 'xp' | 'tips' | 'votes';
type RankingPeriod = 'week' | 'month' | 'all';

interface LeaderboardRow {
  userId: number;
  username: string;
  firstname: string | null;
  lastname: string | null;
  xp: number;
  rank: number;
  avatarProfile: string | null;
  role: string | null;
  tips: number;
  votes: number;
  badges: number;
}

const LEADERBOARD_SIZE = 100;

const { user } = useAuth();
const api = useApi();
const config = useRuntimeConfig();
const { loadGrades, progressFor } = useGrades();

const timeFilter = ref<RankingPeriod>('all');
const categoryFilter = ref<RankingSort>('xp');
const leaderboardData = ref<LeaderboardRow[]>([]);
const loading = ref(true);

// Le classement est calculé par l'API : tri par XP, tips publiés ou votes reçus, sur la période
const loadLeaderboard = async () => {
  loading.value = true;
  try {
    const query = new URLSearchParams({
      sort: categoryFilter.value,
      period: categoryFilter.value === 'xp' ? 'all' : timeFilter.value,
      take: String(LEADERBOARD_SIZE),
    });
    leaderboardData.value = await api.get<LeaderboardRow[]>(
      `${API_ROUTES.USERS.LEADERBOARD}?${query}`,
    );
  } catch {
    leaderboardData.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => Promise.all([loadLeaderboard(), loadGrades()]));
watch([timeFilter, categoryFilter], loadLeaderboard);

const users = computed<RankingUser[]>(() =>
  leaderboardData.value.map((u) => ({
    id: u.userId,
    name: [u.firstname, u.lastname].filter(Boolean).join(' ') || u.username,
    xp: u.xp,
    rank: u.rank,
    avatar: u.avatarProfile ? resolveUploadUrl(u.avatarProfile, config.public.apiBaseUrl) : '',
    role: u.role || 'Membre',
    tips: u.tips,
    votes: u.votes,
  })),
);

const currentUser = computed<CurrentUser | null>(() => {
  if (!user.value) return null;
  const xp = user.value.xp ?? 0;
  const row = users.value.find((u) => u.id === user.value?.id);

  return {
    id: user.value.id,
    rank: row?.rank ?? 0,
    name: user.value.firstname || user.value.username,
    xp,
    avatar: user.value.avatarProfile
      ? resolveUploadUrl(user.value.avatarProfile, config.public.apiBaseUrl)
      : '',
    role: progressFor(xp).current?.name ?? 'Membre',
  };
});

const top1 = computed<RankingUser | undefined>(() => users.value[0]);
const top2 = computed<RankingUser | undefined>(() => users.value[1]);
const top3 = computed<RankingUser | undefined>(() => users.value[2]);
const restOfRanking = computed<RankingUser[]>(() => users.value.slice(3));

const getStatLabel = (): string => {
  const labels: Record<RankingSort, string> = {
    xp: 'XP',
    tips: 'Tips publiés',
    votes: 'Votes reçus',
  };
  return labels[categoryFilter.value];
};

useSeoMeta({
  title: 'Classement Elite - AideFlash',
  description:
    'Découvrez le classement des meilleurs contributeurs AideFlash par XP, tips publiés et votes reçus.',
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

    <p v-if="!loading && users.length === 0" class="text-center text-slate-500 py-12">
      Aucun membre classé sur cette période.
    </p>

    <!-- Podium -->
    <ClientOnly v-if="top1">
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
    <ClientOnly v-if="currentUser">
      <UserProgressBar :user="currentUser" />
    </ClientOnly>
  </div>
</template>
