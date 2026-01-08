<script setup lang="ts">
import { computed } from 'vue';
import SidebarButton from './SidebarButton.vue';
import { mainLinks, userLinks, moderatorLinks } from '~/utils/navigation';

const { user, isAuthenticated } = useAuth();

const isModerator = computed(() => {
  if (!user.value) return false;
  return user.value.moderator?.isActive || user.value.admin;
});
</script>

<template>
  <aside
    class="w-full h-full flex flex-col py-6 px-3 gap-2 bg-linear-to-b from-white/50 to-transparent dark:from-slate-900/50 dark:to-transparent"
  >
    <!-- Navigation Principale -->
    <nav class="flex flex-col gap-2 w-full">
      <SidebarButton
        v-for="link in mainLinks"
        :key="link.to"
        :to="link.to"
        :text="link.text"
        :icon-name="link.icon"
      />
    </nav>

    <!-- Séparateur + Liens Utilisateur (si connecté) -->
    <div v-if="isAuthenticated && userLinks.length > 0" class="flex flex-col gap-2 w-full">
      <div class="w-full h-px bg-blue-100 dark:bg-blue-900/30 my-2" />
      <p class="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 pl-2">Mon Espace</p>
      <SidebarButton
        v-for="link in userLinks"
        :key="link.to"
        :to="link.to"
        :text="link.text"
        :icon-name="link.icon"
      />
    </div>

    <!-- Séparateur + Liens Modération (si modérateur/admin) -->
    <div v-if="isModerator && moderatorLinks.length > 0" class="flex flex-col gap-2 w-full">
      <div class="w-full h-px bg-purple-100 dark:bg-purple-900/30 my-2" />
      <p class="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1 pl-2">
        Modération
      </p>
      <SidebarButton
        v-for="link in moderatorLinks"
        :key="link.to"
        :to="link.to"
        :text="link.text"
        :icon-name="link.icon"
      />
    </div>

    <!-- Bas de Sidebar (Paramètres, Version...) -->
    <div
      class="mt-auto pt-4 border-t border-purple-100/50 dark:border-slate-700/50 flex flex-col gap-2"
    >
      <SidebarButton to="/settings" text="Paramètres" icon-name="tabler:settings" />

      <div class="text-[10px] text-center text-gray-400 dark:text-slate-600 mt-2 font-medium">
        v1.0.0 • © 2025
      </div>
    </div>
  </aside>
</template>
