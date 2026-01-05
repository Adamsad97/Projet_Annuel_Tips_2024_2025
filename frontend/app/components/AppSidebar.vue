<script setup lang="ts">
import SidebarButton from './SidebarButton.vue'
import { mainLinks } from '~/utils/navigation'
</script>

<template>
  <aside
    class="w-full h-full flex flex-col py-6 px-3 gap-2 bg-linear-to-b from-white/50 to-transparent dark:from-slate-900/50 dark:to-transparent">

    <!-- Navigation Principale -->
    <nav class="flex flex-col gap-2 w-full">
      <SidebarButton v-for="link in mainLinks" :key="link.to" :to="link.to" :text="link.text" :icon-name="link.icon" />
    </nav>

    <!-- Bas de Sidebar (Paramètres, Version...) -->
    <div class="mt-auto pt-4 border-t border-purple-100/50 dark:border-slate-700/50 flex flex-col gap-2">
      <SidebarButton to="/settings" text="Paramètres" icon-name="tabler:settings" />

      <div class="text-[10px] text-center text-gray-400 dark:text-slate-600 mt-2 font-medium">
        v1.0.0 • © 2025
      </div>
    </div>

  </aside>
</template>
