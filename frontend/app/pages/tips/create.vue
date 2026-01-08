<script setup lang="ts">
import { ref } from 'vue';
import type { TipFormData } from '~/types/tip';
import TipForm from '~/components/TipForm.vue';

definePageMeta({
  title: 'Créer un Tip',
  middleware: 'auth',
});

const loading = ref(false);
const toast = useToastMessage();
const router = useRouter();
const api = useApi();

const handleCreateTip = async (data: TipFormData) => {
  loading.value = true;

  try {
    const tipData: Record<string, unknown> = {
      title: data.title,
      content: data.content,
    };

    if (data.address) tipData.address = data.address;
    if (data.lat !== undefined) tipData.latitude = data.lat;
    if (data.lng !== undefined) tipData.longitude = data.lng;

    await api.post('/tips', tipData);

    toast.success(
      'Votre tip a été créé avec succès ! Il sera visible après validation par un modérateur.',
      'Tip créé',
    );

    setTimeout(() => {
      router.push('/my-tips');
    }, 1500);
  } catch (error) {
    console.error('erreur creation tip:', error);
  } finally {
    loading.value = false;
  }
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
