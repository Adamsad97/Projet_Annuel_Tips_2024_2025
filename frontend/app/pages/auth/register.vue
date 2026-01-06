<script setup lang="ts">
import type { RegisterCredentials } from '~/types';

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
});

const { register } = useAuth();
const isLoading = ref(false);

const form = ref<RegisterCredentials>({
  username: '',
  email: '',
  password: '',
  firstname: '',
  lastname: '',
});

const handleRegister = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  const success = await register(form.value);
  isLoading.value = false;
  if (success) {
    navigateTo('/profile');
  }
};
</script>

<template>
  <div
    class="min-h-screen rounded-2xl flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
  >
    <!-- Background Elements -->
    <div
      class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none"
    />
    <div
      class="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[120px] pointer-events-none"
    />

    <!-- Bouton retour accueil -->
    <NuxtLink
      to="/"
      class="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all group"
    >
      <Icon
        name="tabler:arrow-left"
        class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
      />
      <span class="font-medium text-sm">Accueil</span>
    </NuxtLink>

    <div class="w-full max-w-md relative z-10 animate-fade-in-up">
      <div
        class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700 shadow-2xl p-8 space-y-8 relative overflow-hidden"
      >
        <div class="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-emerald-400 to-teal-500" />

        <div class="text-center space-y-2">
          <h1 class="text-3xl font-black text-slate-900 dark:text-white">Rejoignez-nous !</h1>
          <p class="text-gray-500 dark:text-gray-400">Commencez à partager votre savoir.</p>
        </div>

        <form class="space-y-6" @submit.prevent="handleRegister">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Prénom</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon
                      name="tabler:user"
                      class="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                    />
                  </div>
                  <input
                    v-model="form.firstname"
                    type="text"
                    placeholder="Jean"
                    class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Nom</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon
                      name="tabler:user"
                      class="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                    />
                  </div>
                  <input
                    v-model="form.lastname"
                    type="text"
                    placeholder="Dupont"
                    class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                Pseudo <span class="text-red-500">*</span>
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icon
                    name="tabler:user-circle"
                    class="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                  />
                </div>
                <input
                  v-model="form.username"
                  type="text"
                  required
                  placeholder="DevNinja"
                  minlength="3"
                  maxlength="50"
                  pattern="[a-zA-Z0-9_-]+"
                  title="Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores"
                  class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                Email <span class="text-red-500">*</span>
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icon
                    name="tabler:at"
                    class="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                  />
                </div>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="exemple@email.com"
                  class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                Mot de passe <span class="text-red-500">*</span>
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Icon
                    name="tabler:lock"
                    class="w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                  />
                </div>
                <input
                  v-model="form.password"
                  type="password"
                  required
                  minlength="8"
                  placeholder="••••••••"
                  title="Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial"
                  class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                Min. 8 caractères avec majuscule, minuscule, chiffre et caractère spécial
              </p>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-500/30 text-sm font-bold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="flex items-center gap-2">
              <Icon name="svg-spinners:180-ring" class="w-5 h-5" />
              Création...
            </span>
            <span>{{ isLoading ? 'Créer mon compte' : "S'inscrire" }}</span>
          </button>
        </form>

        <div class="text-center text-sm text-gray-500">
          Déjà un compte ?
          <NuxtLink
            to="/auth/login"
            class="font-bold text-emerald-600 hover:text-emerald-500 hover:underline"
          >
            Se connecter
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
