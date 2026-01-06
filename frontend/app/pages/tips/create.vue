<script setup lang="ts">
import { ref } from 'vue';
import type { TipFormData } from '~/types/tip';
import TipForm from '~/components/TipForm.vue';

definePageMeta({
  title: 'Créer un Tip',
  middleware: 'auth',
});

const loading = ref(false);

const handleCreateTip = async (data: TipFormData) => {
  loading.value = true;
  // Mock API call
  console.log('Creating Tip:', data);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  loading.value = false;
  navigateTo('/tips'); // Or redirect to the new tip
};
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header Page -->
    <div class="mb-8">
      <h1 class="text-3xl font-black text-slate-800 dark:text-white mb-2">
        Partager un
        <span class="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600"
          >Tip</span
        >
      </h1>
      <p class="text-slate-500 dark:text-slate-400">
        Aidez la communauté en partageant vos meilleures astuces de développement.
      </p>
    </div>

    <!-- Formulaire -->
    <div
      class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl"
    >
      <TipForm :loading="loading" @submit="handleCreateTip" />
    </div>
  </div>
</template>
