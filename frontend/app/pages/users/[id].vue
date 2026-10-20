<script setup lang="ts">
import type { PublicProfile, Tip } from '~/types';
import ProfilPicture from '~/components/ProfilPicture.vue';
import TipsCard from '~/components/TipsCard.vue';
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
  { label: 'XP', value: profile.value?.xp ?? 0, icon: 'tabler:star' },
]);

// Les tips du profil n'embarquent pas leur auteur : on le rajoute pour l'affichage des cartes
const recentTips = computed<Tip[]>(() => {
  if (!profile.value) return [];
  const { id, firstname, lastname, avatarProfile } = profile.value;
  return profile.value.recentTips.map((tip) =>
    mapApiTip(
      { ...tip, user: { id, firstname, lastname, avatarProfile } },
      config.public.apiBaseUrl,
    ),
  );
});

onMounted(async () => {
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
        </div>

        <p
          v-if="profile.bio"
          class="mt-6 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed"
        >
          {{ profile.bio }}
        </p>

        <!-- Statistiques -->
        <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
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
  </div>
</template>
