<template>
  <footer
    class="border-t border-purple-100 dark:border-purple-900 bg-linear-to-r from-purple-50/10 to-white/10"
  >
    <div
      class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-gray-500 sm:flex-row"
    >
      <!-- Left -->
      <div class="flex items-center gap-2">
        <img src="/Logo.svg" alt="Tips" class="h-6 w-6" loading="lazy" />
        <span class="font-medium text-gray-600 dark:text-gray-300">AideFlash</span>
        <span class="hidden sm:inline text-gray-400 dark:text-gray-600">·</span>
        <span class="hidden sm:inline">Apprends, partage et level up.</span>
      </div>

      <!-- Center (links) -->
      <nav class="flex gap-4 text-xs sm:text-xs">
        <NuxtLink
          to="/about"
          class="hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
          >À propos
        </NuxtLink>
        <NuxtLink
          to="/contact"
          class="hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
          >Contact
        </NuxtLink>
        <NuxtLink
          to="/legal"
          class="hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
          >Mentions légales</NuxtLink
        >
      </nav>

      <!-- Right -->
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-400 dark:text-gray-500"
          >© {{ new Date().getFullYear() }} AideFlash</span
        >
      </div>
    </div>
  </footer>
</template>
