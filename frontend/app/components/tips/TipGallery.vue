<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  images?: string[];
}>();

const fullscreenImage = ref<string | null>(null);

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = 'https://placehold.co/600x400?text=Image+Non+Disponible';
};

const openLightbox = (url: string) => {
  fullscreenImage.value = url;
  document.body.style.overflow = 'hidden';
};

const closeLightbox = () => {
  fullscreenImage.value = null;
  document.body.style.overflow = '';
};
</script>

<template>
  <section v-if="images && images.length > 0" class="space-y-4">
    <!-- CAROUSEL -->
    <div
      class="relative group rounded-4xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 bg-black/5 dark:bg-black/40 backdrop-blur-md"
    >
      <div
        class="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-video md:aspect-[21/9]"
      >
        <div
          v-for="(img, idx) in images"
          :key="idx"
          class="snap-center shrink-0 w-full h-full relative cursor-zoom-in"
          @click="openLightbox(img)"
        >
          <img
            :src="img"
            class="w-full h-full object-contain"
            loading="lazy"
            @error="handleImageError"
          />

          <!-- Counter -->
          <div
            class="absolute bottom-6 right-6 bg-black/40 backdrop-blur-xl border border-white/10 text-white text-xs font-bold px-4 py-1.5 rounded-full"
          >
            {{ idx + 1 }} / {{ images.length }}
          </div>
        </div>
      </div>
    </div>

    <!-- LIGHTBOX (Teleported to Body) -->
    <Teleport to="body">
      <div
        v-if="fullscreenImage"
        class="fixed inset-0 z-100 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        @click="closeLightbox"
      >
        <button
          class="absolute top-4 right-4 text-white hover:text-purple-400 transition"
          @click="closeLightbox"
        >
          <Icon name="tabler:x" class="w-8 h-8" />
        </button>
        <img
          :src="fullscreenImage"
          class="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
          @click.stop
        />
      </div>
    </Teleport>
  </section>
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
