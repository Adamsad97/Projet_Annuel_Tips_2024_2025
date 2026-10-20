<script setup lang="ts">
import type { PublicProfile, Tip } from '~/types';
import ProfilPicture from '~/components/ProfilPicture.vue';
import TipsCard from '~/components/TipsCard.vue';
import ActionDialog from '~/components/moderation/ActionDialog.vue';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const config = useRuntimeConfig();
const api = useApi();
const { user: currentUser } = useAuth();

const userId = Number(route.params.id);
if (!Number.isInteger(userId) || userId <= 0) {
  throw createError({ statusCode: 400, statusMessage: 'Identifiant de membre invalide' });
}

const profile = ref<PublicProfile | null>(null);
const loading = ref(true);
const notFound = ref(false);

const ROLE_LABELS: Record<PublicProfile['role'], string> = {
  ADMIN: 'Administrateur',
  MODERATOR: 'Modérateur',
  USER: 'Membre',
};

const isMe = computed(() => currentUser.value?.id === userId);
const isBlocked = ref(false);

// Actions de modération : un modérateur / admin peut avertir ou rétrograder un simple membre
type SanctionKind = 'warn' | 'downgrade';
const sanction = ref<SanctionKind | null>(null);
const sanctionLoading = ref(false);
const canModerate = computed(
  () =>
    !isMe.value &&
    profile.value?.role === 'USER' &&
    !!(currentUser.value?.moderator?.isActive || currentUser.value?.admin),
);

const SANCTIONS: Record<SanctionKind, { title: string; description: string; confirm: string }> = {
  warn: {
    title: 'Avertir ce membre',
    description: 'Le membre recevra une notification et pourra contester cet avertissement.',
    confirm: 'Envoyer l’avertissement',
  },
  downgrade: {
    title: 'Rétrograder ce membre',
    description: 'Son XP redescend au seuil du grade inférieur. Il pourra contester la décision.',
    confirm: 'Rétrograder',
  },
};

const applySanction = async ({ reason }: { reason: string }) => {
  if (!sanction.value) return;

  sanctionLoading.value = true;
  try {
    const endpoint =
      sanction.value === 'warn'
        ? API_ROUTES.MODERATION.WARN(userId)
        : API_ROUTES.MODERATION.DOWNGRADE(userId);
    await api.post(
      endpoint,
      { reason },
      {
        showSuccessToast: true,
        successMessage: sanction.value === 'warn' ? 'Avertissement envoyé' : 'Membre rétrogradé',
      },
    );
    sanction.value = null;
    profile.value = await api.get<PublicProfile>(API_ROUTES.USERS.PUBLIC_PROFILE(userId));
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    sanctionLoading.value = false;
  }
};

const loadBlockStatus = async () => {
  if (isMe.value) return;
  try {
    const blocked = await api.get<Array<{ id: number }>>(API_ROUTES.MESSAGING.BLOCKS, {
      showErrorToast: false,
    });
    isBlocked.value = blocked.some((user) => user.id === userId);
  } catch {
    isBlocked.value = false;
  }
};

const toggleBlock = async () => {
  if (
    !isBlocked.value &&
    !confirm(`Bloquer ${displayName.value} ? Vous ne pourrez plus échanger de messages privés.`)
  ) {
    return;
  }

  try {
    if (isBlocked.value) {
      await api.delete(API_ROUTES.MESSAGING.BLOCK(userId), {
        showSuccessToast: true,
        successMessage: 'Membre débloqué',
      });
    } else {
      await api.post(API_ROUTES.MESSAGING.BLOCK(userId), undefined, {
        showSuccessToast: true,
        successMessage: 'Membre bloqué',
      });
    }
    isBlocked.value = !isBlocked.value;
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

const displayName = computed(() => {
  if (!profile.value) return '';
  const fullName = [profile.value.firstname, profile.value.lastname].filter(Boolean).join(' ');
  return fullName || profile.value.username;
});

const memberSince = computed(() =>
  profile.value
    ? new Date(profile.value.createdAt).toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      })
    : '',
);

const stats = computed(() => [
  { label: 'Tips publiés', value: profile.value?.stats.publishedTips ?? 0, icon: 'tabler:bulb' },
  { label: 'Commentaires', value: profile.value?.stats.comments ?? 0, icon: 'tabler:message' },
  {
    label: 'Votes « utile » reçus',
    value: profile.value?.stats.upvotesReceived ?? 0,
    icon: 'tabler:thumb-up',
  },
  { label: 'Abonnés', value: profile.value?.stats.followers ?? 0, icon: 'tabler:users' },
  { label: 'XP', value: profile.value?.xp ?? 0, icon: 'tabler:star' },
]);

// Abonnement : les nouveaux tips publiés du membre sont notifiés à l'abonné
const followLoading = ref(false);
const toggleFollow = async () => {
  if (!profile.value) return;
  followLoading.value = true;
  try {
    const request = profile.value.isFollowing
      ? api.delete<{ isFollowing: boolean; followers: number }>(API_ROUTES.USERS.FOLLOW(userId))
      : api.post<{ isFollowing: boolean; followers: number }>(API_ROUTES.USERS.FOLLOW(userId));
    const state = await request;
    profile.value.isFollowing = state.isFollowing;
    profile.value.stats.followers = state.followers;
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    followLoading.value = false;
  }
};

// Les tips du profil n'embarquent pas leur auteur : on le rajoute pour l'affichage des cartes
const recentTips = computed<Tip[]>(() => {
  if (!profile.value) return [];
  const { id, username, firstname, lastname, avatarProfile, xp, grade, role } = profile.value;
  const user = {
    id,
    username,
    firstname,
    lastname,
    avatarProfile,
    xp,
    grade: grade ? { name: grade.name } : null,
    moderator: role === 'MODERATOR' ? { isActive: true } : null,
    admin: role === 'ADMIN' ? { userId: id } : null,
  };
  return profile.value.recentTips.map((tip) =>
    mapApiTip({ ...tip, user }, config.public.apiBaseUrl),
  );
});

onMounted(async () => {
  loadBlockStatus();
  try {
    profile.value = await api.get<PublicProfile>(API_ROUTES.USERS.PUBLIC_PROFILE(userId), {
      showErrorToast: false,
    });
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
});

useSeoMeta({
  title: () => (profile.value ? `Profil de ${displayName.value}` : 'Profil'),
});
</script>

<template>
  <div class="min-h-screen py-12 px-4 max-w-5xl mx-auto space-y-8">
    <div v-if="loading" class="text-center text-gray-400 py-20">Chargement du profil…</div>

    <div v-else-if="notFound || !profile" class="text-center py-20 space-y-4">
      <Icon name="tabler:user-question" class="w-16 h-16 text-gray-300 mx-auto" />
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Membre introuvable</h1>
      <NuxtLink :to="ROUTES.TIPS" class="text-purple-600 font-bold hover:underline">
        Retour aux tips
      </NuxtLink>
    </div>

    <template v-else>
      <!-- En-tête -->
      <section
        class="rounded-4xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-xl p-6 md:p-10"
      >
        <div class="flex flex-col md:flex-row md:items-center gap-6">
          <ProfilPicture
            :src="profile.avatarProfile || undefined"
            :alt="displayName"
            :online="false"
          />
          <div class="flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-3xl font-black text-slate-900 dark:text-white">{{ displayName }}</h1>
              <span
                class="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider"
              >
                {{ ROLE_LABELS[profile.role] }}
              </span>
              <span
                v-if="profile.grade"
                class="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400"
              >
                {{ profile.grade.name }}
              </span>
            </div>
            <p class="text-sm text-slate-500">@{{ profile.username }}</p>
            <div class="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span v-if="profile.address" class="flex items-center gap-1">
                <Icon name="tabler:map-pin" class="w-4 h-4" /> {{ profile.address }}
              </span>
              <span class="flex items-center gap-1">
                <Icon name="tabler:calendar" class="w-4 h-4" /> Membre depuis {{ memberSince }}
              </span>
            </div>
          </div>
          <NuxtLink
            v-if="isMe"
            :to="ROUTES.SETTINGS"
            class="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition"
          >
            <Icon name="tabler:pencil" class="w-4 h-4" /> Modifier mon profil
          </NuxtLink>
          <div v-else class="self-start flex flex-wrap gap-2">
            <button
              type="button"
              :disabled="followLoading"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50"
              :class="
                profile.isFollowing
                  ? 'border border-purple-300 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              "
              @click="toggleFollow"
            >
              <Icon
                :name="profile.isFollowing ? 'tabler:user-check' : 'tabler:user-plus'"
                class="w-4 h-4"
              />
              {{ profile.isFollowing ? 'Abonné' : 'Suivre' }}
            </button>
            <NuxtLink
              v-if="!isBlocked"
              :to="{ path: '/messages', query: { to: profile.id } }"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition"
            >
              <Icon name="tabler:message" class="w-4 h-4" /> Envoyer un message
            </NuxtLink>
            <button
              type="button"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition"
              :class="
                isBlocked
                  ? 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  : 'border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              "
              @click="toggleBlock"
            >
              <Icon :name="isBlocked ? 'tabler:lock-open' : 'tabler:ban'" class="w-4 h-4" />
              {{ isBlocked ? 'Débloquer' : 'Bloquer' }}
            </button>
            <template v-if="canModerate">
              <button
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 text-amber-600 text-sm font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                @click="sanction = 'warn'"
              >
                <Icon name="tabler:alert-triangle" class="w-4 h-4" /> Avertir
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 text-amber-600 text-sm font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                @click="sanction = 'downgrade'"
              >
                <Icon name="tabler:trending-down" class="w-4 h-4" /> Rétrograder
              </button>
            </template>
          </div>
        </div>

        <p
          v-if="profile.bio"
          class="mt-6 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed"
        >
          {{ profile.bio }}
        </p>

        <!-- Statistiques -->
        <div class="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-4 text-center"
          >
            <Icon :name="stat.icon" class="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div class="text-2xl font-black text-slate-900 dark:text-white">
              {{ stat.value.toLocaleString('fr-FR') }}
            </div>
            <div class="text-xs text-slate-500">{{ stat.label }}</div>
          </div>
        </div>
      </section>

      <!-- Badges -->
      <section class="space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">
          Badges
          <span class="text-sm font-normal text-gray-400">({{ profile.badges.length }})</span>
        </h2>
        <p v-if="profile.badges.length === 0" class="text-sm text-gray-500">
          Aucun badge débloqué pour le moment.
        </p>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div
            v-for="badge in profile.badges"
            :key="badge.id"
            class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-4 text-center border border-purple-100 dark:border-slate-700"
            :title="badge.description || badge.name"
          >
            <div class="text-3xl mb-1">{{ badge.icon }}</div>
            <div class="font-bold text-sm text-slate-800 dark:text-slate-100">{{ badge.name }}</div>
            <div class="text-[11px] text-slate-500">
              {{ new Date(badge.earnedAt).toLocaleDateString('fr-FR') }}
            </div>
          </div>
        </div>
      </section>

      <!-- Derniers tips -->
      <section class="space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Derniers tips publiés</h2>
        <p v-if="recentTips.length === 0" class="text-sm text-gray-500">
          Aucun tip publié pour le moment.
        </p>
        <div v-else class="grid gap-6">
          <TipsCard v-for="tip in recentTips" :key="tip.id" :tip="tip" />
        </div>
      </section>
    </template>
    <ActionDialog
      :open="!!sanction"
      :title="sanction ? SANCTIONS[sanction].title : ''"
      :description="sanction ? SANCTIONS[sanction].description : ''"
      :confirm-label="sanction ? SANCTIONS[sanction].confirm : ''"
      :loading="sanctionLoading"
      danger
      @confirm="applySanction"
      @close="sanction = null"
    />
  </div>
</template>
