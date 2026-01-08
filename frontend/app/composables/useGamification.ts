interface Grade {
  id: number;
  name: string;
  xpRequired: number;
}

interface Badge {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: Date;
  progress: number;
}

interface UserProgress {
  currentXp: number;
  currentGrade: Grade;
  nextGrade: Grade | null;
  xpToNextGrade: number;
  progressPercent: number;
  badges: Badge[];
  stats: {
    tipsCreated: number;
    commentsCreated: number;
    votesGiven: number;
    followers: number;
  };
}

interface LeaderboardUser {
  id: number;
  username: string;
  xp: number;
  grade: Grade;
  avatarProfile?: string;
}

export const useGamification = () => {
  const api = useApi();

  const progress = ref<UserProgress | null>(null);
  const badges = ref<Badge[]>([]);
  const leaderboard = ref<LeaderboardUser[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchProgress = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<UserProgress>('/users/me/progress');
      progress.value = response;
      console.log('[useGamification] Progress loaded:', response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress';
      error.value = errorMessage;
      console.error('[Gamification] Error fetching progress:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchBadges = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<Badge[]>('/users/me/badges');
      badges.value = response;
      console.log('[useGamification] Badges loaded:', response.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch badges';
      error.value = errorMessage;
      console.error('[Gamification] Error fetching badges:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchLeaderboard = async (limit: number = 10, skip: number = 0) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<LeaderboardUser[]>(
        `/users/leaderboard?limit=${limit}&skip=${skip}`,
      );
      leaderboard.value = response;
      console.log('[useGamification] Leaderboard loaded:', response.length, 'users');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      error.value = errorMessage;
      console.error('[Gamification] Error fetching leaderboard:', err);
    } finally {
      loading.value = false;
    }
  };

  const getCurrentLevel = computed(() => {
    return progress.value?.currentGrade?.name || 'debutant';
  });

  const earnedBadges = computed(() => {
    return badges.value.filter((b) => b.earned);
  });

  const unearnedBadges = computed(() => {
    return badges.value.filter((b) => !b.earned);
  });

  const totalBadges = computed(() => {
    return earnedBadges.value.length;
  });

  const gradeProgress = computed(() => {
    return progress.value?.progressPercent || 0;
  });

  const refreshAll = async () => {
    await Promise.all([fetchProgress(), fetchBadges()]);
  };

  return {
    progress,
    badges,
    leaderboard,
    loading,
    error,

    getCurrentLevel,
    earnedBadges,
    unearnedBadges,
    totalBadges,
    gradeProgress,

    fetchProgress,
    fetchBadges,
    fetchLeaderboard,
    refreshAll,
  };
};
