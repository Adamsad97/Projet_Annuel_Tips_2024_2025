<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const error = computed(() => props.error);

// export a boolean computed at script-time so the template doesn't parse `import.meta` directly
const isDev = Boolean((import.meta as any)?.env?.DEV ?? (import.meta as any)?.dev ?? false);

const title = computed(() => {
  switch (error.value.statusCode) {
    case 404:
      return 'Page introuvable';
    case 401:
      return 'Accès refusé';
    case 500:
      return 'Erreur interne du serveur';
    default:
      return 'Une erreur est survenue';
  }
});

const message = computed(() => error.value.message || 'Erreur inconnue');
function handleRetry() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-gray-50 text-center"
  >
    <h1 class="text-3xl font-bold text-gray-900">
      {{ title }}
    </h1>

    <p class="mt-3 text-gray-600 text-lg">
      {{ message }}
    </p>

    <div class="mt-6 flex gap-3 justify-center">
      <NuxtLink
        to="/"
        class="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow transition"
      >
        Retour à l'accueil
      </NuxtLink>

      <button
        class="inline-block px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-200 transition"
        @click="handleRetry"
      >
        Réessayer
      </button>
    </div>

    <pre
      v-if="isDev && error?.stack"
      class="mt-8 text-left text-xs bg-white p-4 rounded-lg border overflow-auto max-h-64 w-full max-w-2xl text-gray-700"
      >{{ error.stack }}
    </pre>
  </div>
</template>
