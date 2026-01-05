<script setup lang="ts">
import { ref } from 'vue'
import ProfilPicture from './ProfilPicture.vue'
import SearchInput from './SearchInput.vue'
import { mainLinks, secondaryLinks } from '@/utils/navigation'

const openSidebar = ref(false)
const { user, isAuthenticated } = useAuth()
const emit = defineEmits<{
  (e: 'show-search'): void
}>()
const colorMode = useColorMode()

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <header class="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-4 py-4 shadow-md z-30 w-full">
    <div class="flex items-center justify-between w-full">

      <!-- Logo à gauche -->
      <NuxtLink to="/" class="shrink-0">
        <img src="/Logo.svg" alt="Logo" class="h-10 md:h-12">
      </NuxtLink>

      <!-- CENTRE DESKTOP : Navbar Secondaire + Search -->
      <div class="flex-1 flex items-center justify-center mx-4">

        <!-- Navbar Desktop (Liens secondaires uniquement) -->
        <nav class="hidden md:flex gap-6 items-center mr-8">
          <NuxtLink v-for="link in secondaryLinks" :key="link.to" :to="link.to"
            class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition">
            {{ link.text }}
          </NuxtLink>
        </nav>

        <!-- Barre de recherche Desktop -->
        <div class="hidden md:block w-full max-w-xs lg:max-w-sm">
          <SearchInput placeholder="Rechercher..." />
        </div>

        <!-- Loupe Mobile -->
        <button class="md:hidden mx-auto" aria-label="Rechercher" @click="emit('show-search')">
          <Icon name="tabler:search" class="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <!-- DROITE : Actions -->
      <div class="flex items-center gap-3 shrink-0">
        <!-- Dark Mode -->
        <button type="button"
          class="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white/80 text-gray-700 shadow-sm hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 transition"
          @click="toggleTheme">
          <Icon :name="colorMode.value === 'dark' ? 'tabler:moon' : 'tabler:sun-high'" class="w-5 h-5" />
        </button>

        <!-- Profil (Si connecté) -->
        <NuxtLink v-if="isAuthenticated && user" to="/profile" class="flex items-center gap-2 group">
          <ProfilPicture :src="user.avatar" :alt="user.name" />
          <div class="hidden sm:flex flex-col items-start">
            <span class="text-xs font-bold text-gray-700 dark:text-slate-200 group-hover:text-purple-600 transition">{{
              user.xp }} xp</span>
            <div class="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-0.5 overflow-hidden">
              <div class="h-full rounded-full" :class="user.xp >= 5000 ? 'bg-emerald-500' : 'bg-purple-300'"
                :style="{ width: Math.min(100, (user.xp / 5000) * 100) + '%' }" />
            </div>
          </div>
        </NuxtLink>

        <!-- Auth Buttons (Si déconnecté) -->
        <div v-else class="flex items-center gap-2">
          <NuxtLink to="/auth/login"
            class="hidden sm:inline-flex px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition">
            Connexion
          </NuxtLink>
          <NuxtLink to="/auth/register"
            class="px-4 py-2 text-sm font-bold text-white bg-linear-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all">
            Inscription
          </NuxtLink>
        </div>

        <!-- Burger Mobile -->
        <button class="md:hidden ml-1 text-gray-700 dark:text-gray-200" aria-label="Menu" @click="openSidebar = true">
          <Icon name="tabler:menu-2" class="w-7 h-7" />
        </button>
      </div>
    </div>

    <!-- MENU MOBILE FULLSCREEN (Teleport) -->
    <Teleport to="body">
      <div v-if="openSidebar" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end md:hidden"
        @click="openSidebar = false">
        <div
          class="bg-white dark:bg-slate-900 shadow-2xl w-5/6 max-w-xs h-full p-6 flex flex-col overflow-y-auto border-l border-gray-100 dark:border-slate-700 transition-transform duration-300"
          @click.stop>
          <div class="flex justify-between items-center mb-8">
            <span class="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Menu</span>
            <button class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              @click="openSidebar = false">
              <Icon name="tabler:x" class="w-7 h-7 text-gray-500" />
            </button>
          </div>

          <!-- 1. Liens Principaux (Sidebar) -->
          <div class="flex flex-col gap-2 mb-6">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-2">Navigation</p>
            <NuxtLink v-for="link in mainLinks" :key="link.to" :to="link.to"
              class="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
              active-class="bg-purple-100/60 text-purple-700 dark:bg-slate-800 dark:text-purple-400 shadow-sm"
              @click="openSidebar = false">
              <Icon :name="link.icon" class="w-5 h-5" />
              {{ link.text }}
            </NuxtLink>
          </div>

          <div class="w-full h-px bg-gray-100 dark:bg-slate-800 mb-6" />

          <!-- 2. Liens Secondaires (Header) -->
          <div class="flex flex-col gap-2">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-2">Infos</p>
            <NuxtLink v-for="link in secondaryLinks" :key="link.to" :to="link.to"
              class="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              active-class="text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-slate-800/50"
              @click="openSidebar = false">
              <Icon :name="link.icon" class="w-5 h-5 opacity-70" />
              {{ link.text }}
            </NuxtLink>
          </div>

          <!-- Infos bas de menu -->
          <div class="mt-auto pt-6 text-center">
            <p class="text-xs text-gray-400">AideFlash v1.0</p>
          </div>

        </div>
      </div>
    </Teleport>
  </header>
</template>
