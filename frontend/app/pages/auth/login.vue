<script setup lang="ts">
import { ref, computed } from 'vue';
import type { LoginCredentials } from '~/types';

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
});

const form = ref<LoginCredentials>({ email: '', password: '' });
const isLoading = ref(false);
const step = ref<'credentials' | 'two-factor'>('credentials');
const twoFactorCode = ref('');
const { login, verifyTwoFactor, cancelTwoFactor } = useAuth();
const route = useRoute();

// Retour à la page demandée avant la connexion (ex: vote sur un tip)
const redirectTarget = computed(() => {
  const redirect = route.query.redirect;
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/profile';
});

const handleLogin = async () => {
  isLoading.value = true;
  const result = await login(form.value);
  isLoading.value = false;

  if (result === 'success') {
    navigateTo(redirectTarget.value);
  } else if (result === 'two-factor') {
    step.value = 'two-factor';
  }
};

const handleTwoFactor = async () => {
  if (twoFactorCode.value.trim().length < 6) return;

  isLoading.value = true;
  const success = await verifyTwoFactor(twoFactorCode.value.trim());
  isLoading.value = false;

  if (success) {
    navigateTo(redirectTarget.value);
  } else {
    twoFactorCode.value = '';
  }
};

const backToCredentials = () => {
  cancelTwoFactor();
  twoFactorCode.value = '';
  form.value.password = '';
  step.value = 'credentials';
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative">
    <!-- Bouton retour accueil -->
    <NuxtLink
      to="/"
      class="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all group"
    >
      <Icon
        name="tabler:arrow-left"
        class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
      />
      <span class="font-medium text-sm">Accueil</span>
    </NuxtLink>

    <div class="w-full max-w-md">
      <div
        class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700 shadow-2xl p-8 space-y-8 relative overflow-hidden"
      >
        <div class="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-purple-500 to-pink-500" />

        <!-- Étape 2 : code de double authentification -->
        <template v-if="step === 'two-factor'">
          <div class="text-center space-y-2">
            <Icon name="tabler:shield-lock" class="w-12 h-12 text-purple-600 mx-auto" />
            <h1 class="text-2xl font-black text-slate-900 dark:text-white">
              Vérification en deux étapes
            </h1>
            <p class="text-gray-500 dark:text-gray-400 text-sm">
              Saisissez le code à 6 chiffres de votre application d'authentification, ou un de vos
              codes de secours.
            </p>
          </div>

          <form class="space-y-6" @submit.prevent="handleTwoFactor">
            <input
              v-model="twoFactorCode"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="9"
              required
              autofocus
              placeholder="123456"
              class="block w-full px-4 py-3 text-center text-2xl tracking-[0.4em] font-bold bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />

            <button
              type="submit"
              :disabled="isLoading || twoFactorCode.trim().length < 6"
              class="w-full py-3.5 px-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Icon v-if="isLoading" name="tabler:loader" class="animate-spin w-5 h-5" />
              <span>{{ isLoading ? 'Vérification...' : 'Valider' }}</span>
            </button>

            <button
              type="button"
              class="w-full text-sm font-bold text-gray-500 hover:text-purple-600"
              @click="backToCredentials"
            >
              ← Revenir à la connexion
            </button>
          </form>
        </template>

        <template v-else>
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
                    <Icon
                      name="tabler:at"
                      class="w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors"
                    />
                  </div>
                  <input
                    v-model="form.email"
                    type="email"
                    required
                    placeholder="exemple@email.com"
                    class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex justify-between items-center ml-1">
                  <label class="text-sm font-bold text-gray-700 dark:text-gray-300"
                    >Mot de passe</label
                  >
                  <NuxtLink
                    to="/auth/forgot-password"
                    class="text-xs font-bold text-purple-600 hover:text-purple-500"
                  >
                    Oublié ?
                  </NuxtLink>
                </div>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icon
                      name="tabler:lock"
                      class="w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors"
                    />
                  </div>
                  <input
                    v-model="form.password"
                    type="password"
                    required
                    placeholder="••••••••"
                    class="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-3.5 px-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Icon v-if="isLoading" name="tabler:loader" class="animate-spin w-5 h-5" />
              <span>{{ isLoading ? 'Connexion...' : 'Se connecter' }}</span>
            </button>
          </form>

          <div class="text-center text-sm text-gray-500">
            Pas encore de compte ?
            <NuxtLink
              to="/auth/register"
              class="font-bold text-purple-600 hover:text-purple-500 hover:underline"
            >
              Créer un compte
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
