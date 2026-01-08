<script setup lang="ts">
import ProfilPicture from '@/components/ProfilPicture.vue';
import XpProgressBar from '@/components/gamification/XpProgressBar.vue';
import BadgeDisplay from '@/components/gamification/BadgeDisplay.vue';

definePageMeta({
  middleware: 'auth',
});

const { user: authUser, logout } = useAuth();
const gamification = useGamification();

onMounted(async () => {
  console.log('[Profile] Loading gamification data...');
  await gamification.refreshAll();
  console.log('[Profile] Gamification data loaded:', {
    hasProgress: !!gamification.progress.value,
    hasBadges: gamification.badges.value.length > 0,
    progressPercent: gamification.progress.value?.progressPercent,
    currentXp: gamification.progress.value?.currentXp,
  });
});

const user = computed(() => {
  if (!authUser.value)
    return {
      name: 'Invité',
      avatar: '/avatar.svg',
      xp: 0,
      nextRankXp: 500,
      roleLabel: 'Visiteur',
      roleIcon: 'tabler:user',
      levelLabel: 'Découvreur',
      location: 'Inconnu',
      joinedAt: 'Récemment',
      bio: 'Connectez-vous pour voir votre profil.',
      stats: [],
    };

  const currentProgress = gamification.progress.value;
  const displayName =
    authUser.value.firstname && authUser.value.lastname
      ? `${authUser.value.firstname} ${authUser.value.lastname}`
      : authUser.value.firstname || authUser.value.lastname || authUser.value.email;

  return {
    name: displayName,
    avatar: authUser.value.avatarProfile || '/avatar.svg',
    xp: currentProgress?.currentXp || 0,
    nextRankXp: currentProgress?.nextGrade?.xpRequired || 500,
    roleLabel: currentProgress?.currentGrade?.name || 'Débutant',
    roleIcon: 'tabler:star',
    levelLabel: currentProgress?.currentGrade?.name || 'Découvreur',
    location: authUser.value.address || 'Non renseigné',
    joinedAt: `Membre depuis ${new Date(authUser.value.createdAt).getFullYear()}`,
    bio: authUser.value.bio || 'Aucune bio renseignée.',
    stats: [
      { label: 'Tips publiés', value: currentProgress?.stats?.tipsCreated || 0 },
      { label: 'Commentaires', value: currentProgress?.stats?.commentsCreated || 0 },
      { label: 'Votes donnés', value: currentProgress?.stats?.votesGiven || 0 },
      { label: 'Followers', value: currentProgress?.stats?.followers || 0 },
    ],
  };
});

const xpPercent = computed(() => {
  if (!gamification.progress.value) return 0;
  return gamification.progress.value.progressPercent || 0;
});

const xpSteps = [
  { label: 'Niveau 1 – Découvreur', min: 0, max: 499, range: '0 – 499 XP' },
  { label: 'Niveau 2 – Collaborateur', min: 500, max: 1999, range: '500 – 1 999 XP' },
  { label: 'Niveau 3 – Expert', min: 2000, max: 4999, range: '2 000 – 4 999 XP' },
  { label: 'Niveau 4 – Ambassadeur', min: 5000, max: 9999, range: '5 000 – 9 999 XP' },
  { label: 'Niveau 5 – Légende', min: 10000, max: Infinity, range: '10 000+ XP' },
];
</script>

<template>
  <main class="max-w-6xl mx-auto py-8 md:py-10 px-4 space-y-8">
    <!-- En‑tête profil -->
    <section
      class="rounded-3xl bg-white/60 dark:bg-slate-800 shadow-md border border-purple-100/70 dark:border-purple-700/70 backdrop-blur-sm px-6 md:px-10 py-6 md:py-8"
    >
      <!-- Ligne top : avatar + nom + édition -->
      <div class="flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-between">
        <div class="flex flex-col items-center md:items-start gap-3">
          <ProfilPicture :src="user.avatar" :alt="user.name" />
          <div class="text-center md:text-left">
            <h1 class="text-2xl md:text-3xl font-semibold text-teal-700 dark:text-teal-400">
              {{ user.name }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ user.location }} · {{ user.joinedAt }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="inline-flex items-center gap-2 rounded-full bg-purple-50 dark:bg-purple-900 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700"
          >
            <Icon :name="user.roleIcon" class="w-4 h-4" />
            <span>{{ user.roleLabel }}</span>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-slate-800 p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 hover:border-purple-300 transition"
            aria-label="Éditer le profil"
          >
            <Icon name="tabler:pencil" class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="logout"
            class="inline-flex items-center justify-center rounded-full border border-red-200 dark:border-red-600 bg-white/80 dark:bg-slate-800 p-2 text-red-500 dark:text-red-400 hover:text-red-600 hover:border-red-300 transition"
            aria-label="Se déconnecter"
          >
            <Icon name="tabler:logout" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Progression XP -->
      <div class="mt-6 space-y-3">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ user.levelLabel }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ user.xp }} XP sur {{ user.nextRankXp }} · {{ xpPercent }}% vers le prochain grade
          </p>
        </div>

        <div class="w-full h-3 rounded-full bg-gray-200/80 dark:bg-gray-700 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 dark:from-purple-600 dark:to-emerald-500 transition-all duration-500"
            :style="{ width: xpPercent + '%' }"
          />
        </div>
      </div>

      <!-- Stats + bio courte -->
      <div class="mt-6 grid gap-6 md:grid-cols-[2fr,3fr]">
        <div
          class="rounded-2xl bg-purple-50/70 dark:bg-purple-900 border border-purple-100 dark:border-purple-700 px-4 py-3 flex flex-wrap gap-4 items-center justify-between"
        >
          <div v-for="stat in user.stats" :key="stat.label" class="flex flex-col min-w-[110px]">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ stat.label }}
            </span>
            <span class="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {{ stat.value.toLocaleString('fr-FR') }}
            </span>
          </div>
        </div>

        <div class="space-y-2">
          <h2 class="text-sm font-semibold text-slate-800 dark:text-slate-100">À propos de vous</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ user.bio }}
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span
              class="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900 px-3 py-1 text-emerald-700 dark:text-emerald-400"
            >
              <Icon name="tabler:sparkles" class="w-3 h-3" />
              Gamification active
            </span>
            <span
              class="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-900 px-3 py-1 text-purple-700 dark:text-purple-400"
            >
              <Icon name="tabler:shield-check" class="w-3 h-3" />
              Compte sécurisé (2FA)
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Section Badges -->
    <section
      class="rounded-3xl bg-white/60 dark:bg-slate-800 shadow-md border border-purple-100/70 dark:border-purple-700/70 backdrop-blur-sm px-6 md:px-10 py-6 md:py-8"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100">
          Collection de Badges
        </h2>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ gamification.earnedBadges.value.length }} /
          {{ gamification.badges.value.length }} débloqués
        </div>
      </div>

      <div v-if="gamification.loading.value" class="text-center py-12">
        <div
          class="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"
        ></div>
        <p class="text-gray-500 dark:text-gray-400 mt-4">Chargement des badges...</p>
      </div>

      <div v-else-if="gamification.badges.value.length === 0" class="text-center py-12">
        <Icon
          name="tabler:trophy-off"
          class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
        />
        <p class="text-gray-500 dark:text-gray-400">Aucun badge disponible pour le moment.</p>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="badge in gamification.badges.value"
          :key="badge.id"
          class="group relative rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          :class="
            badge.earned
              ? 'bg-linear-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400 dark:border-yellow-600'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
          "
        >
          <div class="text-center space-y-2">
            <div
              class="text-4xl mx-auto w-16 h-16 flex items-center justify-center rounded-full"
              :class="
                badge.earned
                  ? 'bg-yellow-100 dark:bg-yellow-900/40'
                  : 'bg-gray-200 dark:bg-gray-700'
              "
            >
              {{ badge.icon }}
            </div>
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">
              {{ badge.name }}
            </h3>
            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {{ badge.description }}
            </p>
            <div
              class="text-xs font-semibold"
              :class="badge.earned ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'"
            >
              +{{ badge.xpReward }} XP
            </div>

            <!-- Badge earned indicator -->
            <div v-if="badge.earned" class="absolute top-2 right-2">
              <Icon name="tabler:check-circle" class="w-5 h-5 text-green-500" />
            </div>

            <!-- Progress bar for badges with progress -->
            <div v-if="!badge.earned && badge.progress > 0" class="mt-2">
              <div class="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  class="h-full rounded-full bg-purple-500"
                  :style="{ width: badge.progress + '%' }"
                />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ badge.progress }}%</p>
            </div>
          </div>

          <!-- Tooltip hover -->
          <div
            class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl"
          >
            {{
              badge.earned
                ? `Débloqué le ${new Date(badge.earnedAt!).toLocaleDateString('fr-FR')}`
                : 'Non débloqué'
            }}
          </div>
        </div>
      </div>
    </section>

    <!-- Roadmap XP & règles -->
    <section
      class="rounded-3xl bg-linear-to-br from-purple-100/80 via-white to-purple-50/80 dark:from-purple-900 dark:via-slate-800 dark:to-purple-900 shadow-md border border-purple-100/60 dark:border-purple-700 px-6 md:px-10 py-6 md:py-8"
    >
      <h2 class="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
        Vos récompenses & progression XP
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Découvrez comment votre activité sur AideFlash vous permet de gagner de l’XP, débloquer de
        nouveaux badges et obtenir plus de pouvoirs communautaires.
      </p>

      <div class="grid gap-6 md:grid-cols-[2fr,3fr]">
        <!-- Niveaux -->
        <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
            Paliers de niveaux
          </h3>
          <ul class="space-y-1.5">
            <li v-for="step in xpSteps" :key="step.label" class="flex items-center gap-2">
              <span
                class="h-2 w-2 rounded-full"
                :class="step.label === user.levelLabel ? 'bg-emerald-500' : 'bg-purple-300'"
              />
              <span class="font-medium text-slate-800 dark:text-slate-100">
                {{ step.label }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400"> · {{ step.range }} </span>
            </li>
          </ul>
        </div>

        <!-- Règles résumé -->
        <div class="space-y-2 text-xs md:text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
          <p class="font-semibold text-slate-800 dark:text-slate-100">Comment gagner de l’XP ?</p>
          <ul class="list-disc pl-4 space-y-1.5">
            <li>Publier un tip validé par la communauté.</li>
            <li>Répondre à des questions avec des réponses utiles et bien notées.</li>
            <li>Commenter de manière constructive et respectueuse.</li>
            <li>Signaler un contenu inapproprié validé par la modération.</li>
            <li>Maintenir une activité régulière sans infraction aux règles.</li>
          </ul>
          <p class="mt-3 font-semibold text-slate-800 dark:text-slate-100">
            Sanctions & rétrogradations
          </p>
          <ul class="list-disc pl-4 space-y-1.5">
            <li>
              Les contenus supprimés pour non‑respect des règles peuvent faire perdre de l’XP.
            </li>
            <li>
              Des comportements abusifs ou des signalements abusifs répétés peuvent entraîner une
              perte de grade.
            </li>
            <li>
              Les modérateurs très actifs peuvent gagner des permissions supplémentaires ;
              l’inactivité prolongée peut entraîner un retour au rôle utilisateur.
            </li>
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>
