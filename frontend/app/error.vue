<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{
  error: NuxtError;
}>();

const handleError = () => clearError({ redirect: '/' });

const isDev = Boolean(
  (import.meta as unknown as { env?: { DEV?: boolean }; dev?: boolean })?.env?.DEV ??
  (import.meta as unknown as { env?: { DEV?: boolean }; dev?: boolean })?.dev ??
  false,
);

const errorMessages = {
  404: {
    title: 'Page introuvable',
    description: "Désolé, la page que vous recherchez n'existe pas ou a été déplacée.",
    emoji: '🔍',
  },
  500: {
    title: 'Erreur serveur',
    description: "Une erreur inattendue s'est produite. Nos équipes ont été notifiées.",
    emoji: '⚠️',
  },
  401: {
    title: 'Accès refusé',
    description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
    emoji: '🔒',
  },
  default: {
    title: 'Une erreur est survenue',
    description: "Quelque chose s'est mal passé. Veuillez réessayer.",
    emoji: '❌',
  },
};

const errorInfo = computed(() => {
  const statusCode = props.error.statusCode;
  if (statusCode === 404) return errorMessages[404];
  if (statusCode === 500) return errorMessages[500];
  if (statusCode === 401) return errorMessages[401];
  return errorMessages.default;
});
</script>

<template>
  <div
    class="min-h-screen w-full bg-linear-to-br from-purple-100 via-violet-200 to-white dark:from-slate-900 dark:via-green-950 dark:to-slate-950 flex items-center justify-center px-4"
  >
    <div class="max-w-2xl w-full text-center">
      <!-- Error Icon -->
      <div class="mb-8">
        <div
          class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-purple-100 dark:bg-purple-900/30 text-6xl mb-6 animate-bounce"
        >
          {{ errorInfo.emoji }}
        </div>
        <h1 class="text-8xl font-black text-purple-600 dark:text-purple-400 mb-4">
          {{ error.statusCode || 500 }}
        </h1>
        <h2 class="text-3xl font-bold text-slate-800 dark:text-white mb-4">
          {{ errorInfo.title }}
        </h2>
        <p class="text-lg text-slate-600 dark:text-slate-400 mb-8">
          {{ errorInfo.description }}
        </p>
      </div>

      <!-- Error Details (dev mode only) -->
      <div
        v-if="isDev && error.message"
        class="mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
      >
        <p class="text-sm font-mono text-red-600 dark:text-red-400">{{ error.message }}</p>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          @click="handleError"
          class="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-105"
        >
          <Icon name="tabler:home" class="w-5 h-5 inline-block mr-2" />
          Retour à l'accueil
        </button>
        <button
          @click="$router.back()"
          class="px-8 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl border-2 border-slate-200 dark:border-slate-600 transition-all duration-200 hover:scale-105"
        >
          <Icon name="tabler:arrow-left" class="w-5 h-5 inline-block mr-2" />
          Page précédente
        </button>
      </div>

      <!-- Additional Links -->
      <div class="mt-12 flex gap-6 justify-center text-sm">
        <NuxtLink
          to="/"
          class="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          Accueil
        </NuxtLink>
        <NuxtLink
          to="/tips"
          class="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          Explorer les Tips
        </NuxtLink>
        <NuxtLink
          to="/contact"
          class="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          Contact
        </NuxtLink>
      </div>

      <!-- Stack trace in dev -->
      <pre
        v-if="isDev && error?.stack"
        class="mt-8 text-left text-xs bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 overflow-auto max-h-64 w-full text-slate-700 dark:text-slate-300"
        >{{ error.stack }}</pre
      >
    </div>
  </div>
</template>
