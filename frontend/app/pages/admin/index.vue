<script setup lang="ts">
import { ref } from 'vue';
import AdminAnalytics from '~/components/admin/AdminAnalytics.vue';
import AdminUsers from '~/components/admin/AdminUsers.vue';
import AdminAppeals from '~/components/admin/AdminAppeals.vue';
import AdminGamification from '~/components/admin/AdminGamification.vue';
import AdminTrust from '~/components/admin/AdminTrust.vue';
import AdminChatbot from '~/components/admin/AdminChatbot.vue';
import AdminLogs from '~/components/admin/AdminLogs.vue';
import AdminFeatures from '~/components/admin/AdminFeatures.vue';
import AdminSponsoring from '~/components/admin/AdminSponsoring.vue';

definePageMeta({
  middleware: ['auth', 'admin'],
});

useSeoMeta({ title: 'Administration' });

const tabs = [
  { id: 'analytics', label: 'Tableau de bord', icon: 'tabler:chart-bar' },
  { id: 'users', label: 'Utilisateurs', icon: 'tabler:users' },
  { id: 'trust', label: 'Confiance', icon: 'tabler:shield-half' },
  { id: 'appeals', label: 'Contestations', icon: 'tabler:scale' },
  { id: 'gamification', label: 'Badges & grades', icon: 'tabler:award' },
  { id: 'chatbot', label: 'Chatbot', icon: 'tabler:message-chatbot' },
  { id: 'sponsoring', label: 'Publicité', icon: 'tabler:speakerphone' },
  { id: 'features', label: 'Fonctionnalités (A/B)', icon: 'tabler:flask' },
  { id: 'logs', label: 'Logs', icon: 'tabler:bug' },
] as const;

type TabId = (typeof tabs)[number]['id'];

// Gestion directe de la base : lien vers Adminer, affiché seulement s'il est configuré
const adminerUrl = useRuntimeConfig().public.adminerUrl as string;

const route = useRoute();
const router = useRouter();

// L'onglet actif est dans l'URL pour pouvoir partager un lien direct
const activeTab = ref<TabId>(
  tabs.some((tab) => tab.id === route.query.tab) ? (route.query.tab as TabId) : 'analytics',
);

const selectTab = (id: TabId) => {
  activeTab.value = id;
  router.replace({ query: { tab: id } });
};
</script>

<template>
  <div class="max-w-7xl mx-auto py-10 px-4 space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-4xl font-black text-slate-900 dark:text-white">Administration</h1>
        <p class="text-slate-500">Utilisateurs, modération, gamification et statistiques.</p>
      </div>
      <a
        v-if="adminerUrl"
        :href="adminerUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800"
        title="Gestion directe de la base de données (développement)"
      >
        <Icon name="tabler:database" class="w-4 h-4" /> Base de données (Adminer)
      </a>
    </header>

    <nav class="flex flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition"
        :class="
          activeTab === tab.id
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
            : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
        "
        @click="selectTab(tab.id)"
      >
        <Icon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </nav>

    <AdminAnalytics v-if="activeTab === 'analytics'" />
    <AdminUsers v-else-if="activeTab === 'users'" />
    <AdminTrust v-else-if="activeTab === 'trust'" />
    <AdminAppeals v-else-if="activeTab === 'appeals'" />
    <AdminGamification v-else-if="activeTab === 'gamification'" />
    <AdminChatbot v-else-if="activeTab === 'chatbot'" />
    <AdminSponsoring v-else-if="activeTab === 'sponsoring'" />
    <AdminFeatures v-else-if="activeTab === 'features'" />
    <AdminLogs v-else-if="activeTab === 'logs'" />
  </div>
</template>
