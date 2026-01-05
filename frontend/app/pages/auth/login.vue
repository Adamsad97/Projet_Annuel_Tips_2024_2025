<script setup lang="ts">
import { ref } from 'vue'
import type { LoginCredentials } from '@@/types'

definePageMeta({
  layout: 'default'
})

const form = ref<LoginCredentials>({ email: '', password: '' })
const isLoading = ref(false)
const { login } = useAuth()

const handleLogin = async () => {
  isLoading.value = true
  const success = await login(form.value)
  isLoading.value = false

  if (success) {
    navigateTo('/profile')
  } else {
    alert('Connexion échouée. Essayez avec un email de seed.json (ex: jean.dupont@example.com)')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div
        class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700 shadow-2xl p-8 space-y-8 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-purple-500 to-pink-500" />

        <div class="text-center space-y-2">
          <h1 class="text-3xl font-black text-slate-900 dark:text-white">Bon retour !</h1>
          <p class="text-gray-500 dark:text-gray-400">Connectez-vous pour partager vos tips.</p>
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icon name="tabler:at"
                    class="w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                </div>
                <input v-model="form.email" type="email" required placeholder="exemple@email.com"
                  class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all">
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between items-center ml-1">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Mot de passe</label>
                <NuxtLink to="/auth/forgot-password" class="text-xs font-bold text-purple-600 hover:text-purple-500">
                  Oublié ?
                </NuxtLink>
              </div>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icon name="tabler:lock"
                    class="w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                </div>
                <input v-model="form.password" type="password" required placeholder="••••••••"
                  class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all">
              </div>
            </div>
          </div>

          <button type="submit" :disabled="isLoading"
            class="w-full py-3.5 px-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Icon v-if="isLoading" name="tabler:loader" class="animate-spin w-5 h-5" />
            <span>{{ isLoading ? 'Connexion...' : 'Se connecter' }}</span>
          </button>
        </form>

        <div class="text-center text-sm text-gray-500">
          Pas encore de compte ?
          <NuxtLink to="/auth/register" class="font-bold text-purple-600 hover:text-purple-500 hover:underline">
            Créer un compte
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
