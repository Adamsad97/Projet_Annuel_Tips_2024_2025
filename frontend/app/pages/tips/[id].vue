<script setup lang="ts">
import type { Tip as PrismaTip, User } from '@prisma/client';
import CommentsSection from '~/components/CommentsSection.vue';
import TipHero from '~/components/tips/TipHero.vue';
import TipGallery from '~/components/tips/TipGallery.vue';
import TipMap from '~/components/tips/TipMap.vue';
import TipResources from '~/components/tips/TipResources.vue';
import TipAuthorCard from '~/components/tips/TipAuthorCard.vue';

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const config = useRuntimeConfig();
const apiBaseUrl = config.public.apiBaseUrl;
const { user: currentUser } = useAuth();

const tipId = route.params.id;

if (!tipId || Array.isArray(tipId)) {
  throw createError({ statusCode: 400, statusMessage: 'ID de tip invalide', fatal: true });
}

interface BackendTipResponse extends PrismaTip {
  user: Pick<User, 'id' | 'firstname' | 'lastname' | 'email' | 'avatarProfile'> & {
    role?: string;
  };
  categories?: Array<{
    category: {
      id: number;
      name: string;
    };
  }>;
  comments?: Array<{
    id: number;
    content: string;
    createdAt: Date;
    user: Pick<User, 'id' | 'firstname' | 'lastname' | 'avatarProfile'>;
  }>;
  _count?: {
    comments: number;
    votes: number;
    views: number;
  };
}

const { data: rawResponse, error } = await useFetch<{ success: boolean; data: BackendTipResponse }>(
  `${apiBaseUrl}/tips/${tipId}`,
);

if (error.value || !rawResponse.value?.data) {
  throw createError({ statusCode: 404, statusMessage: 'Tip introuvable', fatal: true });
}

const backendTip = computed(() => rawResponse.value?.data);

const tip = computed(() => {
  if (!backendTip.value) return null;

  const bt = backendTip.value;
  const displayName =
    bt.user.firstname && bt.user.lastname
      ? `${bt.user.firstname} ${bt.user.lastname}`
      : bt.user.firstname || bt.user.lastname || bt.user.email;

  return {
    id: bt.id,
    userId: bt.user.id,
    title: bt.title,
    description: bt.content?.substring(0, 200) || bt.title,
    content: bt.content || '',
    tags: bt.categories?.map((c) => c.category.name) || [],
    difficulty: 1,
    author: {
      id: bt.user.id,
      name: displayName,
      xp: 0, 
      avatar: bt.user.avatarProfile || '',
      role: 'Membre',
    },
    publishedAgo: new Date(bt.createdAt).toLocaleDateString('fr-FR'),
    views: bt._count?.views || 0,
    created_at: bt.createdAt.toString(),
    address: bt.address || undefined,
    lat: bt.latitude || undefined,
    lng: bt.longitude || undefined,
    images: bt.images as string[] | undefined,
    documents: bt.documents as { name: string; url: string }[] | undefined,
    status: bt.status,
  };
});

if (!tip.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tip introuvable', fatal: true });
}

const isOwner = computed(() => currentUser.value?.id === tip.value?.userId);

const statusConfig = computed(() => {
  switch (tip.value?.status) {
    case 'PENDING':
      return {
        label: 'En attente de validation',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
        icon: 'tabler:clock',
      };
    case 'APPROVED':
      return {
        label: 'Approuvé',
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
        icon: 'tabler:check-circle',
      };
    case 'REJECTED':
      return {
        label: 'Rejeté',
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
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
  <!-- FOND FIXE AVEC GRADIENTS -->
  <div class="min-h-screen">
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
            <div v-if="statusConfig && isOwner" class="relative mb-6 flex justify-between items-center">
              <div :class="['inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium', statusConfig.color]">
                <Icon :name="statusConfig.icon" class="w-5 h-5" />
                {{ statusConfig.label }}
              </div>

              <!-- Share Button -->
              <button
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition-colors font-medium text-sm"
              >
                <Icon name="tabler:share" class="w-4 h-4" />
                Partager
              </button>
            </div>

            <!-- Share Button for non-owners -->
            <div v-else-if="!isOwner" class="relative mb-6 flex justify-end">
              <button
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition-colors font-medium text-sm"
              >
                <Icon name="tabler:share" class="w-4 h-4" />
                Partager
              </button>
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
          </article>

          <!-- 2. PHOTOS -->
          <TipGallery :images="tip.images" />

          <!-- 3. BENTO GRID (Map & Docs) -->
          <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TipMap :lat="tip.lat" :lng="tip.lng" :address="tip.address" />
            <TipResources :documents="tip.documents" />
          </section>

          <!-- Commentaires -->
          <CommentsSection class="pt-8 border-t border-slate-200/50 dark:border-white/5" />
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
