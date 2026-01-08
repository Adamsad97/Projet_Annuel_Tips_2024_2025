<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import AppInput from '~/components/ui/AppInput.vue';
import AppTextarea from '~/components/ui/AppTextarea.vue';
import AppButton from '~/components/ui/AppButton.vue';
import ProfilPicture from '~/components/ProfilPicture.vue';

definePageMeta({
  middleware: 'auth',
});

const { user, logout } = useAuth();

const activeTab = ref('general');

const form = reactive({
  name: user.value?.firstname && user.value?.lastname
    ? `${user.value.firstname} ${user.value.lastname}`
    : user.value?.firstname || user.value?.lastname || '',
  email: user.value?.email || '', // Note: Type User needs email or we assume it exists
  bio: user.value?.bio || 'Passionné de bricolage et de partage.',
  address: user.value?.address || '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const notifications = reactive<Record<string, boolean>>({
  email: true,
  push: false,
  newsletter: true,
});

const security = reactive({
  twoFactor: false,
});

watch(
  user,
  (newUser) => {
    if (newUser) {
      form.name = newUser.firstname && newUser.lastname
        ? `${newUser.firstname} ${newUser.lastname}`
        : newUser.firstname || newUser.lastname || '';
      form.email = newUser.email || '';
    }
  },
  { immediate: true },
);

const saveProfile = () => {
  alert('Profil mis à jour avec succès !');
};

const updatePassword = () => {
  alert('Mot de passe modifié !');
};

const tabs = [
  { id: 'general', label: 'Général', icon: 'tabler:user' },
  { id: 'security', label: 'Sécurité', icon: 'tabler:lock' },
  { id: 'notifications', label: 'Notifications', icon: 'tabler:bell' },
];
</script>

<template>
  <div class="min-h-screen py-12 px-4 max-w-7xl mx-auto">
    <!-- En-tête -->
    <header class="mb-12 flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-black text-slate-900 dark:text-white mb-2">Paramètres</h1>
        <p class="text-slate-500 font-medium">Gérez votre compte et vos préférences</p>
      </div>
      <AppButton
        variant="secondary"
        class="!bg-red-500/10 !text-red-500 hover:!bg-red-500/20 !border-red-500/20"
        @click="logout"
      >
        <Icon name="tabler:logout" class="w-5 h-5 mr-2" />
        Déconnexion
      </AppButton>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- SIDEBAR -->
      <aside class="lg:col-span-3">
        <nav class="space-y-2 sticky top-24">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all duration-300 group relative overflow-hidden"
            :class="
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            "
            @click="activeTab = tab.id"
          >
            <Icon :name="tab.icon" class="w-5 h-5" />
            <span>{{ tab.label }}</span>

            <div
              v-if="activeTab === tab.id"
              class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </button>
        </nav>
      </aside>

      <!-- CONTENT -->
      <main class="lg:col-span-9">
        <div
          class="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-4xl border border-white/50 dark:border-white/10 shadow-2xl p-8 md:p-10 min-h-[600px] relative overflow-hidden"
        >
          <!-- Background Glow -->
          <div
            class="absolute -top-20 -right-20 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"
          />

          <!-- TAB: GENERAL -->
          <div v-if="activeTab === 'general'" class="space-y-8 animate-fade-in">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Icon name="tabler:user-circle" class="text-purple-600" />
              Profil Public
            </h2>

            <!-- Avatar -->
            <div
              class="flex items-center gap-6 p-6 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-white/20"
            >
              <div class="relative group">
                <ProfilPicture
                  :src="user?.avatarProfile || 'https://i.pravatar.cc/150?u=1'"
                  size="xl"
                  class="w-24 h-24 text-4xl"
                />
                <button
                  class="absolute bottom-0 -right-2 bg-purple-600 text-white px-2 py-1 rounded-full shadow-lg hover:scale-110 transition-transform z-20"
                >
                  <Icon name="tabler:camera" />
                </button>
              </div>
              <div>
                <h3 class="font-bold text-lg text-slate-900 dark:text-white">Votre Photo</h3>
                <p class="text-sm text-slate-500 mb-3">
                  Affichée sur votre profil et vos commentaires.
                </p>
                <div class="flex gap-3">
                  <button class="text-xs font-bold text-purple-600 hover:underline">Changer</button>
                  <button class="text-xs font-bold text-red-500 hover:underline">Supprimer</button>
                </div>
              </div>
            </div>

            <!-- Form -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AppInput
                id="name"
                v-model="form.name"
                label="Nom d'affichage"
                placeholder="Votre nom"
              />
              <AppInput
                id="email"
                v-model="form.email"
                label="Email"
                type="email"
                placeholder="votre@email.com"
              />
              <div class="md:col-span-2">
                <AppTextarea
                  id="bio"
                  v-model="form.bio"
                  label="Biographie"
                  placeholder="Parlez-nous de vous..."
                  :rows="4"
                />
              </div>
              <div class="md:col-span-2">
                <AppInput
                  id="address"
                  v-model="form.address"
                  label="Localisation"
                  placeholder="Paris, France"
                  icon="tabler:map-pin"
                />
              </div>
            </div>

            <div class="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <AppButton @click="saveProfile">Sauvegarder les modifications</AppButton>
            </div>
          </div>

          <!-- TAB: SECURITY -->
          <div v-if="activeTab === 'security'" class="space-y-8 animate-fade-in">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Icon name="tabler:shield-lock" class="text-purple-600" />
              Sécurité
            </h2>

            <div class="space-y-6">
              <div class="p-6 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-white/20">
                <h3 class="font-bold text-lg mb-4 text-slate-900 dark:text-white">
                  Changer de mot de passe
                </h3>
                <div class="grid gap-4 max-w-md">
                  <AppInput
                    id="currentPassword"
                    v-model="form.currentPassword"
                    label="Mot de passe actuel"
                    type="password"
                  />
                  <AppInput
                    id="newPassword"
                    v-model="form.newPassword"
                    label="Nouveau mot de passe"
                    type="password"
                  />
                  <AppInput
                    id="confirmPassword"
                    v-model="form.confirmPassword"
                    label="Confirmer le mot de passe"
                    type="password"
                  />
                  <div class="pt-2">
                    <AppButton variant="secondary" @click="updatePassword">Mettre à jour</AppButton>
                  </div>
                </div>
              </div>

              <div
                class="flex items-center justify-between p-6 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-white/20"
              >
                <div>
                  <div
                    class="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"
                  >
                    Double Authentification (2FA)
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-black bg-green-500/10 text-green-600 uppercase"
                      >Recommandé</span
                    >
                  </div>
                  <p class="text-sm text-slate-500 mt-1">
                    Sécurisez votre compte avec une étape supplémentaire.
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="security.twoFactor" type="checkbox" class="sr-only peer" />
                  <div
                    class="w-14 h-7 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
                  ></div>
                </label>
              </div>
            </div>
          </div>

          <!-- TAB: NOTIFICATIONS -->
          <div v-if="activeTab === 'notifications'" class="space-y-8 animate-fade-in">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Icon name="tabler:bell-ringing" class="text-purple-600" />
              Préférences de Notifications
            </h2>

            <div class="space-y-4">
              <div
                v-for="(val, key) in notifications"
                :key="key"
                class="flex items-center justify-between p-5 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-white/20 hover:bg-white/80 transition-colors"
              >
                <div>
                  <div class="font-bold text-slate-900 dark:text-white capitalize">{{ key }}</div>
                  <div class="text-xs text-slate-500">Recevoir des notifications par {{ key }}</div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="notifications[key]" type="checkbox" class="sr-only peer" />
                  <div
                    class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
                  ></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
