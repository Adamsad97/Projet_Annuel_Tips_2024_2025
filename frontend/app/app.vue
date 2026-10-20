<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { useAuthStore } from './stores/auth';
import AppToast from './components/ui/Toast.vue';

const showSearch = ref(false);
const inputRef = ref<ComponentPublicInstance | null>(null);
const toastRef = ref<InstanceType<typeof AppToast> | null>(null);
const toast = useState('toast-instance');
const authStore = useAuthStore();
// Le rendu serveur ne connaît pas la session (stockée dans le navigateur) : il affiche
// directement la page, et le client attend l'initialisation de l'authentification.
const ready = computed(() => import.meta.server || authStore.isInitialized);

watch(showSearch, (open) => {
  if (open && inputRef.value) {
    setTimeout(() => {
      const input = inputRef.value?.$el?.querySelector('input') as HTMLInputElement | null;
      input?.focus();
    }, 50);
  }
});

// Le composant de notifications vit dans la mise en page, montée après app.vue :
// on l'enregistre dès que sa référence est disponible
watch(toastRef, (instance) => {
  if (instance) toast.value = instance;
});

useSiteMeta();
</script>

<template>
  <NuxtLayout>
    <div
      v-if="!ready"
      class="fixed inset-0 z-50 flex items-center justify-center dark:bg-slate-950"
    >
      <div class="text-center">
        <svg
          class="animate-spin h-10 w-10 mx-auto text-purple-600 dark:text-purple-400"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    </div>

    <div v-show="ready">
      <NuxtPage />
    </div>

    <!-- Toast toujours visible, même pendant l'initialisation -->
    <AppToast ref="toastRef" />
  </NuxtLayout>
</template>
