<script setup lang="ts">
import ProfilPicture from '@/components/ProfilPicture.vue';
import GradePerksCard from '@/components/gamification/GradePerksCard.vue';
import { API_ROUTES } from '~/config/api';

definePageMeta({
  middleware: 'auth',
});

const { user: authUser, logout } = useAuth();
const gamification = useGamification();
const { grades, loadGrades } = useGrades();
const api = useApi();

// Barème d'XP appliqué par le backend (clé = action)
const xpRules = ref<Record<string, number>>({});

onMounted(async () => {
  await Promise.all([
    gamification.refreshAll(),
    loadGrades(),
    api
      .get<Record<string, number>>(API_ROUTES.PLATFORM.XP_RULES, { showErrorToast: false })
      .then((rules) => (xpRules.value = rules))
      .catch(() => {}),
  ]);
});

const user = computed(() => {
  if (!authUser.value) return null;

  const currentProgress = gamification.progress.value;
  const fullName = [authUser.value.firstname, authUser.value.lastname].filter(Boolean).join(' ');

  return {
    name: fullName || authUser.value.username,
    avatar: authUser.value.avatarProfile || '',
    xp: currentProgress?.currentXp ?? authUser.value.xp ?? 0,
    nextGrade: currentProgress?.nextGrade ?? null,
    gradeName: currentProgress?.currentGrade?.name ?? null,
    location: authUser.value.address || 'Non renseigné',
    joinedAt: `Membre depuis ${new Date(authUser.value.createdAt).getFullYear()}`,
    bio: authUser.value.bio || 'Aucune bio renseignée.',
    twoFactor: authUser.value.isTwoFactorEnabled,
    stats: [
      { label: 'Tips publiés', value: currentProgress?.stats?.tipsCreated ?? 0 },
      { label: 'Commentaires', value: currentProgress?.stats?.commentsCreated ?? 0 },
      { label: 'Votes donnés', value: currentProgress?.stats?.votesGiven ?? 0 },
      { label: 'Abonnés', value: currentProgress?.stats?.followers ?? 0 },
    ],
  };
});

const xpPercent = computed(() => Math.round(gamification.progress.value?.progressPercent ?? 0));

// Paliers réels : chaque grade va de son seuil au seuil du grade suivant
const gradeSteps = computed(() =>
  grades.value.map((grade, index) => {
    const next = grades.value[index + 1];
    const format = (xp: number) => xp.toLocaleString('fr-FR');
    return {
      name: grade.name,
      range: next
        ? `${format(grade.xpRequired)} – ${format(next.xpRequired - 1)} XP`
        : `${format(grade.xpRequired)}+ XP`,
    };
  }),
);

const XP_RULE_LABELS: Array<{ key: string; label: string }> = [
  { key: 'TIP_CREATED', label: 'Publier un tip ou une question' },
  { key: 'TIP_APPROVED', label: 'Tip validé par un modérateur' },
  { key: 'TIP_UPVOTED', label: 'Vote positif reçu sur un tip' },
  { key: 'COMMENT_CREATED', label: 'Écrire un commentaire' },
  { key: 'COMMENT_UPVOTED', label: 'Vote positif reçu sur un commentaire' },
  { key: 'MODERATION_ACTION', label: 'Action de modération (modérateurs)' },
  { key: 'TIP_DOWNVOTED', label: 'Vote négatif reçu sur un tip' },
];

const xpRuleRows = computed(() =>
  XP_RULE_LABELS.filter((rule) => xpRules.value[rule.key] !== undefined).map((rule) => ({
    ...rule,
    value: xpRules.value[rule.key]!,
  })),
);
</script>

<template>
  <main v-if="user" class="max-w-6xl mx-auto py-8 md:py-10 px-4 space-y-8">
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
            v-if="user.gradeName"
            class="inline-flex items-center gap-2 rounded-full bg-purple-50 dark:bg-purple-900 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700"
          >
            <Icon name="tabler:star" class="w-4 h-4" />
            <span>{{ user.gradeName }}</span>
          </div>
          <NuxtLink
            to="/settings"
            class="inline-flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-slate-800 p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 hover:border-purple-300 transition"
            aria-label="Éditer le profil"
          >
            <Icon name="tabler:pencil" class="w-4 h-4" />
          </NuxtLink>
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
            {{ user.gradeName ?? 'Sans grade' }}
          </p>
          <p v-if="user.nextGrade" class="text-xs text-gray-500 dark:text-gray-400">
            {{ user.xp.toLocaleString('fr-FR') }} XP sur
            {{ user.nextGrade.xpRequired.toLocaleString('fr-FR') }} · {{ xpPercent }} % vers le
            grade {{ user.nextGrade.name }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400">
            {{ user.xp.toLocaleString('fr-FR') }} XP · grade maximal atteint
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
              v-if="user.twoFactor"
              class="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-900 px-3 py-1 text-purple-700 dark:text-purple-400"
            >
              <Icon name="tabler:shield-check" class="w-3 h-3" />
              Compte sécurisé (2FA)
            </span>
            <NuxtLink
              v-else
              to="/settings"
              class="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/40 px-3 py-1 text-amber-700 dark:text-amber-400 hover:underline"
            >
              <Icon name="tabler:shield-off" class="w-3 h-3" />
              2FA désactivée : l'activer
            </NuxtLink>
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

    <!-- Avantages débloqués par le grade -->
    <GradePerksCard />

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
        <!-- Grades -->
        <div class="space-y-2 text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
            Paliers de grades
          </h3>
          <ul class="space-y-1.5">
            <li v-for="step in gradeSteps" :key="step.name" class="flex items-center gap-2">
              <span
                class="h-2 w-2 rounded-full"
                :class="step.name === user.gradeName ? 'bg-emerald-500' : 'bg-purple-300'"
              />
              <span class="font-medium text-slate-800 dark:text-slate-100">
                {{ step.name }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400"> · {{ step.range }} </span>
            </li>
          </ul>
        </div>

        <!-- Barème réel -->
        <div class="space-y-2 text-xs md:text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
          <p class="font-semibold text-slate-800 dark:text-slate-100">Comment gagner de l’XP ?</p>
          <ul class="space-y-1.5">
            <li v-for="rule in xpRuleRows" :key="rule.key" class="flex justify-between gap-4">
              <span>{{ rule.label }}</span>
              <span
                class="font-bold"
                :class="rule.value < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'"
              >
                {{ rule.value > 0 ? '+' : '' }}{{ rule.value }} XP
              </span>
            </li>
            <li class="flex justify-between gap-4">
              <span>Badges et défis sponsorisés</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">bonus variable</span>
            </li>
          </ul>
          <p class="mt-3 font-semibold text-slate-800 dark:text-slate-100">
            Sanctions & rétrogradations
          </p>
          <ul class="list-disc pl-4 space-y-1.5">
            <li>Un modérateur peut vous rétrograder d’un grade en cas d’abus.</li>
            <li>
              Les comportements abusifs peuvent mener à une suspension, un bannissement ou un
              passage en lecture seule.
            </li>
            <li>Chaque sanction peut être contestée depuis la page « Ma modération ».</li>
          </ul>
        </div>
      </div>
    </section>
  </main>
</template>
