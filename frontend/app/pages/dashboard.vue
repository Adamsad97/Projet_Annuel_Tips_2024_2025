<script setup lang="ts">
import AppCard from '~/components/ui/Card.vue';
import AppButton from '~/components/ui/AppButton.vue';
import AppAlert from '~/components/ui/Alert.vue';

definePageMeta({
  middleware: 'auth',
  layout: 'default',
});

const { user } = useAuth();

function formatDate(date?: string) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Bienvenue {{ user?.firstname || user?.email }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AppCard>
        <div class="text-center p-6">
          <p class="text-4xl font-bold text-purple-600 dark:text-purple-400">0</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Tips partagés</p>
        </div>
      </AppCard>

      <AppCard>
        <div class="text-center p-6">
          <p class="text-4xl font-bold text-purple-600 dark:text-purple-400">
            {{ user?.trustIndex || 0 }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Indice de confiance</p>
        </div>
      </AppCard>

      <AppCard>
        <div class="text-center p-6">
          <p class="text-4xl font-bold text-purple-600 dark:text-purple-400">0</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Followers</p>
        </div>
      </AppCard>
    </div>

    <AppCard>
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Mes informations</h2>
          <AppButton variant="secondary" size="sm">Modifier</AppButton>
        </div>

        <div class="space-y-3">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Email</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ user?.email }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Membre depuis</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(user?.createdAt) }}
            </p>
          </div>
        </div>
      </div>
    </AppCard>

    <AppAlert type="info" title="Astuce">
      Commencez par créer votre premier tip pour partager vos connaissances !
    </AppAlert>
  </div>
</template>
