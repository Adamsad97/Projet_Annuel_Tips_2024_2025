<script setup lang="ts">
import type { RegisterDTO } from '@@/types'

const { register } = useAuth()
const isLoading = ref(false)

const form = ref<RegisterDTO>({
  username: '',
  email: '',
  password: ''
})

const handleRegister = async () => {
  if (isLoading.value) return
  isLoading.value = true
  await register(form.value)
  isLoading.value = false
}
</script>

<template>
  <div
    class="min-h-screen rounded-2xl flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Background Elements -->
    <div
      class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none" />
    <div
      class="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[120px] pointer-events-none" />

    <div class="w-full max-w-md relative z-10 animate-fade-in-up">
      <div
        class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700 shadow-2xl p-8 space-y-8 relative overflow-hidden">

        <div class="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-emerald-400 to-teal-500" />

        <div class="text-center space-y-2">
          <h1 class="text-3xl font-black text-slate-900 dark:text-white">Rejoignez-nous !</h1>
          <p class="text-gray-500 dark:text-gray-400">Commencez à partager votre savoir.</p>
        </div>

        <form class="space-y-6" @submit.prevent="handleRegister">
          <div class="space-y-4">

            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Pseudo</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icon name="tabler:user"
                    class="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input v-model="form.username" type="text" required placeholder="DevNinja"
                  class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icon name="tabler:at"
                    class="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input v-model="form.email" type="email" required placeholder="exemple@email.com"
                  class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Mot de passe</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icon name="tabler:lock"
                    class="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input v-model="form.password" type="password" required placeholder="••••••••"
                  class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all">
              </div>
            </div>

          </div>

          <button type="submit" :disabled="isLoading"
            class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/30 text-sm font-bold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
            <span v-if="isLoading" class="flex items-center gap-2">
              <Icon name="svg-spinners:180-ring" class="w-5 h-5" />
              Création...
            </span>
            <span>{{ isLoading ? 'Créer mon compte' : "S'inscrire" }}</span>
          </button>
        </form>

        <div class="text-center text-sm text-gray-500">
          Déjà un compte ?
          <NuxtLink to="/auth/login" class="font-bold text-emerald-600 hover:text-emerald-500 hover:underline">
            Se connecter
          </NuxtLink>
        </div>

      </div>
    </div>
  </div>
</template>
