<script setup lang="ts">
import type { ApiTip, VoteSummary } from '~/types';
import VoteButtons from '~/components/interactions/VoteButtons.vue';
import ReportButton from '~/components/interactions/ReportButton.vue';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';
import CommentsSection from '~/components/CommentsSection.vue';
import TipHero from '~/components/tips/TipHero.vue';
import TipGallery from '~/components/tips/TipGallery.vue';
import TipMap from '~/components/tips/TipMap.vue';
import TipResources from '~/components/tips/TipResources.vue';
import TipAuthorCard from '~/components/tips/TipAuthorCard.vue';

const route = useRoute();
const config = useRuntimeConfig();
const apiBaseUrl = config.public.apiBaseUrl;
const { user: currentUser } = useAuth();

const tipId = route.params.id;

if (!tipId || Array.isArray(tipId)) {
  throw createError({ statusCode: 400, statusMessage: 'ID de tip invalide', fatal: true });
}

// Rendu serveur sans token : un visiteur reçoit l'aperçu d'un tip publié.
// Un membre connecté recharge ensuite le tip complet côté client (voir onMounted),
// ce qui permet aussi à l'auteur d'ouvrir son tip encore en attente.
const { data: rawResponse } = await useFetch<{ success: boolean; data: ApiTip }>(
  `${apiBaseUrl}/tips/${tipId}`,
);
const notFound = ref(false);

const backendTip = computed(() => rawResponse.value?.data);

const tip = computed(() => {
  if (!backendTip.value) return null;

  const bt = backendTip.value;
  const mapped = mapApiTip(bt, apiBaseUrl);

  return {
    ...mapped,
    id: bt.id,
    userId: bt.userId,
    difficulty: 1,
    author: {
      id: bt.user?.id ?? bt.userId,
      name: getAuthorName(bt.user),
      xp: 0,
      avatar: bt.user?.avatarProfile || '',
      role: 'Membre',
    },
    status: bt.status,
  };
});

const isOwner = computed(() => currentUser.value?.id === tip.value?.userId);
const numericTipId = Number(tipId);
const isPublished = computed(() => tip.value?.status === 'APPROVED');
const isPreview = computed(() => !!backendTip.value?.isPreview);

const votes = ref<VoteSummary>(
  backendTip.value?.votes ?? { upvotes: 0, downvotes: 0, score: 0, userVote: 0 },
);

// Membre connecté : contenu complet et vote de l'utilisateur, avec son token
const api = useApi();
onMounted(async () => {
  if (!currentUser.value) {
    notFound.value = !rawResponse.value?.data;
    return;
  }
  try {
    const freshTip = await api.get<ApiTip>(API_ROUTES.TIPS.DETAIL(numericTipId), {
      showErrorToast: false,
    });
    rawResponse.value = { success: true, data: freshTip };
    if (freshTip.votes) votes.value = freshTip.votes;
  } catch {
    notFound.value = !rawResponse.value?.data;
  }
});

const statusConfig = computed(() => {
  switch (tip.value?.status) {
    case 'PENDING':
      return {
        label: 'En attente de validation',
        color:
          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
        icon: 'tabler:clock',
      };
    case 'APPROVED':
      return {
        label: 'Approuvé',
        color:
          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
        icon: 'tabler:check-circle',
      };
    case 'REJECTED':
      return {
        label: 'Rejeté',
        color:
          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
        icon: 'tabler:x-circle',
      };
    default:
      return null;
  }
});

useSeoMeta({
  title: () => tip.value?.title,
  description: () => tip.value?.description?.substring(0, 160),
});
</script>

<template>
  <div v-if="notFound" class="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4">
    <Icon name="tabler:file-off" class="w-14 h-14 text-slate-300" />
    <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Tip introuvable</h1>
    <NuxtLink :to="ROUTES.TIPS" class="text-purple-600 font-bold hover:underline">
      Retour aux tips
    </NuxtLink>
  </div>

  <div v-else-if="!tip" class="min-h-[60vh] flex items-center justify-center text-slate-400">
    Chargement du tip…
  </div>

  <!-- FOND FIXE AVEC GRADIENTS -->
  <div v-else class="min-h-screen">
    <!-- HERO SECTION -->
    <TipHero :tip="tip" />

    <!-- MAIN GRID -->
    <div class="max-w-7xl mx-auto px-4 md:px-6 -mt-4 relative z-20">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- LEFT COLUMN (Content) -->
        <main class="lg:col-span-8 space-y-8">
          <!-- 1. CONTENU (Carte Glassmorphism Principale) -->
          <article
            class="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-4xl p-8 md:p-12 shadow-2xl shadow-purple-500/5 border border-white/50 dark:border-white/5 ring-1 ring-white/20 relative overflow-hidden"
          >
            <!-- Subtle gradient overlay -->
            <div
              class="absolute inset-0 bg-linear-to-b from-white/20 to-transparent pointer-events-none"
            />

            <!-- Status Badge (owner only) - Cleaner position at top of content -->
            <div
              v-if="statusConfig && isOwner"
              class="relative mb-6 flex justify-between items-center"
            >
              <div
                :class="[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium',
                  statusConfig.color,
                ]"
              >
                <Icon :name="statusConfig.icon" class="w-5 h-5" />
                {{ statusConfig.label }}
              </div>

              <!-- Actions : vote, signalement, partage -->
              <div class="flex flex-wrap items-center gap-2">
                <VoteButtons
                  v-if="isPublished"
                  :endpoint="API_ROUTES.VOTES.TIP(numericTipId)"
                  :score="votes.score"
                  :user-vote="votes.userVote"
                  :disabled="isOwner"
                  @update="votes = $event"
                />
                <ReportButton
                  v-if="isPublished && !isOwner"
                  :endpoint="API_ROUTES.REPORTS.TIP(numericTipId)"
                  target="ce tip"
                />
                <button
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition-colors font-medium text-sm"
                >
                  <Icon name="tabler:share" class="w-4 h-4" />
                  Partager
                </button>
              </div>
            </div>

            <!-- Actions pour les non-auteurs -->
            <div v-else-if="!isOwner" class="relative mb-6 flex justify-end">
              <div class="flex flex-wrap items-center gap-2">
                <VoteButtons
                  v-if="isPublished"
                  :endpoint="API_ROUTES.VOTES.TIP(numericTipId)"
                  :score="votes.score"
                  :user-vote="votes.userVote"
                  :disabled="isOwner"
                  @update="votes = $event"
                />
                <ReportButton
                  v-if="isPublished && !isOwner"
                  :endpoint="API_ROUTES.REPORTS.TIP(numericTipId)"
                  target="ce tip"
                />
                <button
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition-colors font-medium text-sm"
                >
                  <Icon name="tabler:share" class="w-4 h-4" />
                  Partager
                </button>
              </div>
            </div>

            <!-- Intro -->
            <p
              class="relative text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-200 leading-relaxed mb-10 pl-6 border-l-4 border-purple-500/50"
            >
              {{ tip.description }}
            </p>

            <!-- Corps du texte -->
            <div
              class="relative prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-purple-600 dark:prose-a:text-purple-400 hover:prose-a:underline prose-strong:text-slate-900 dark:prose-strong:text-white prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-pink-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md"
            >
              <div class="whitespace-pre-line">{{ tip.content }}</div>
            </div>

            <!-- Visiteur : seul le début du tip est affiché -->
            <div
              v-if="isPreview"
              class="relative mt-8 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-6 text-center space-y-3"
            >
              <p class="font-bold text-slate-800 dark:text-slate-100">
                Connectez-vous pour lire la suite, voir les photos et la discussion.
              </p>
              <div class="flex justify-center gap-3">
                <NuxtLink
                  :to="{ path: ROUTES.LOGIN, query: { redirect: route.fullPath } }"
                  class="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700"
                >
                  Se connecter
                </NuxtLink>
                <NuxtLink
                  :to="ROUTES.REGISTER"
                  class="px-4 py-2 rounded-xl border border-purple-300 text-purple-700 dark:text-purple-300 text-sm font-bold hover:bg-white/60"
                >
                  Créer un compte
                </NuxtLink>
              </div>
            </div>
          </article>

          <!-- 2. PHOTOS -->
          <TipGallery :images="tip.images" />

          <!-- 3. BENTO GRID (Map & Docs) -->
          <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TipMap :lat="tip.lat" :lng="tip.lng" :address="tip.address" />
            <TipResources :documents="tip.documents" />
          </section>

          <!-- Commentaires -->
          <CommentsSection
            v-if="isPublished && currentUser"
            :tip-id="numericTipId"
            :title="tip.kind === 'QUESTION' ? 'Réponses' : 'Discussion'"
            class="pt-8 border-t border-slate-200/50 dark:border-white/5"
          />
        </main>

        <!-- RIGHT COLUMN (Sidebar Sticky Glass) -->
        <TipAuthorCard :author="tip.author" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
