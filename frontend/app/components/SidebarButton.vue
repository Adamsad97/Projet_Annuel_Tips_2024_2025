<script setup lang="ts">
defineProps({
  to: { type: String, required: true },
  text: { type: String, required: true },
  iconName: { type: String, required: true },
});
</script>

<template>
  <NuxtLink
    :to="to"
    active-class="!bg-purple-100/80 !text-purple-700 dark:!bg-purple-900/30 dark:!text-purple-300 shadow-sm"
    class="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-300 transition-all duration-200 group"
  >
    <!-- Icône avec animation légère au survol -->
    <Icon :name="iconName" class="w-5 h-5 transition-transform group-hover:scale-110" />

    <!-- Texte -->
    <span class="text-sm font-medium tracking-wide">
      {{ text }}
    </span>
  </NuxtLink>
</template>
