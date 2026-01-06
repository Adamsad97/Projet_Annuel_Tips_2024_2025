<script setup lang="ts">
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
const tipId = route.params.id;

// Fetch Tip Data (Mock ou API)
const { data: tip, error } = await useFetch<Tip>(`/api/tips/${tipId}`);

if (error.value || !tip.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tip introuvable', fatal: true });
}

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
