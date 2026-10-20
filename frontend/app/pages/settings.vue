<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import AppInput from '~/components/ui/AppInput.vue';
import AppTextarea from '~/components/ui/AppTextarea.vue';
import AppButton from '~/components/ui/AppButton.vue';
import ProfilPicture from '~/components/ProfilPicture.vue';
import TwoFactorSettings from '~/components/settings/TwoFactorSettings.vue';
import type { User } from '~/types';
import { API_ROUTES } from '~/config/api';

definePageMeta({
  middleware: 'auth',
});

const { user, logout } = useAuth();
const authStore = useAuthStore();
const api = useApi();
const toast = useToastMessage();

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MAX_BIO_LENGTH = 500;

const activeTab = ref('general');

const form = reactive({
  firstname: '',
  lastname: '',
  bio: '',
  address: '',
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Catégories suivies : notification en temps réel à chaque nouveau tip publié
const { categories, loadCategories, toggleFollow } = useCategoryFollow();
onMounted(loadCategories);

const savingProfile = ref(false);
const savingPassword = ref(false);
const uploadingAvatar = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);

watch(
  user,
  (newUser) => {
    if (newUser) {
      form.firstname = newUser.firstname || '';
      form.lastname = newUser.lastname || '';
      form.bio = newUser.bio || '';
      form.address = newUser.address || '';
    }
  },
  { immediate: true },
);

const saveProfile = async () => {
  savingProfile.value = true;
  try {
    const updated = await api.patch<User>(
      API_ROUTES.USERS.PROFILE,
      { ...form },
      { showSuccessToast: true, successMessage: 'Profil mis à jour' },
    );
    authStore.setUser(updated);
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    savingProfile.value = false;
  }
};

const openAvatarPicker = () => avatarInput.value?.click();

const onAvatarSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  if (file.size > MAX_AVATAR_SIZE) {
    toast.error('Image trop volumineuse (5 Mo maximum)');
    return;
  }

  const formData = new FormData();
  formData.append('avatar', file);

  uploadingAvatar.value = true;
  try {
    const updated = await api.post<User>(API_ROUTES.USERS.AVATAR, formData, {
      showSuccessToast: true,
      successMessage: 'Photo de profil mise à jour',
    });
    authStore.setUser(updated);
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    uploadingAvatar.value = false;
  }
};

const removeAvatar = async () => {
  uploadingAvatar.value = true;
  try {
    const updated = await api.delete<User>(API_ROUTES.USERS.AVATAR);
    authStore.setUser(updated);
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    uploadingAvatar.value = false;
  }
};

const updatePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error('Les deux mots de passe ne correspondent pas');
    return;
  }

  savingPassword.value = true;
  try {
    await api.patch(
      API_ROUTES.USERS.PASSWORD,
      {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
      { showSuccessToast: true, successMessage: 'Mot de passe modifié' },
    );
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    savingPassword.value = false;
  }
};

const tabs = [
  { id: 'general', label: 'Général', icon: 'tabler:user' },
  { id: 'security', label: 'Sécurité', icon: 'tabler:lock' },
  { id: 'notifications', label: 'Catégories suivies', icon: 'tabler:bell' },
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
                  :src="user?.avatarProfile || undefined"
                  :online="false"
                  class="w-24 h-24 text-4xl"
                />
                <button
                  type="button"
                  class="absolute bottom-0 -right-2 bg-purple-600 text-white px-2 py-1 rounded-full shadow-lg hover:scale-110 transition-transform z-20 disabled:opacity-50"
                  :disabled="uploadingAvatar"
                  title="Changer la photo"
                  @click="openAvatarPicker"
                >
                  <Icon
                    :name="uploadingAvatar ? 'tabler:loader-2' : 'tabler:camera'"
                    :class="{ 'animate-spin': uploadingAvatar }"
                  />
                </button>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="hidden"
                  @change="onAvatarSelected"
                />
              </div>
              <div>
                <h3 class="font-bold text-lg text-slate-900 dark:text-white">Votre Photo</h3>
                <p class="text-sm text-slate-500 mb-3">
                  Affichée sur votre profil et vos commentaires (JPG, PNG, WebP ou GIF, 5 Mo max).
                </p>
                <div class="flex gap-3">
                  <button
                    type="button"
                    class="text-xs font-bold text-purple-600 hover:underline disabled:opacity-50"
                    :disabled="uploadingAvatar"
                    @click="openAvatarPicker"
                  >
                    Changer
                  </button>
                  <button
                    v-if="user?.avatarProfile"
                    type="button"
                    class="text-xs font-bold text-red-500 hover:underline disabled:opacity-50"
                    :disabled="uploadingAvatar"
                    @click="removeAvatar"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>

            <!-- Form -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AppInput
                id="firstname"
                v-model="form.firstname"
                label="Prénom"
                placeholder="Prénom"
              />
              <AppInput id="lastname" v-model="form.lastname" label="Nom" placeholder="Nom" />
              <div class="md:col-span-2 text-sm text-slate-500">
                Email :
                <span class="font-medium text-slate-700 dark:text-slate-300">{{
                  user?.email
                }}</span>
                · Pseudo :
                <span class="font-medium text-slate-700 dark:text-slate-300">{{
                  user?.username
                }}</span>
              </div>
              <div class="md:col-span-2">
                <AppTextarea
                  id="bio"
                  v-model="form.bio"
                  label="Biographie"
                  placeholder="Parlez-nous de vous..."
                  :rows="4"
                />
                <p
                  class="mt-1 text-xs text-right"
                  :class="form.bio.length > MAX_BIO_LENGTH ? 'text-red-500' : 'text-gray-400'"
                >
                  {{ form.bio.length }}/{{ MAX_BIO_LENGTH }}
                </p>
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
              <AppButton
                :loading="savingProfile"
                :disabled="form.bio.length > MAX_BIO_LENGTH"
                @click="saveProfile"
              >
                Sauvegarder les modifications
              </AppButton>
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
                    v-model="passwordForm.currentPassword"
                    label="Mot de passe actuel"
                    type="password"
                  />
                  <AppInput
                    id="newPassword"
                    v-model="passwordForm.newPassword"
                    label="Nouveau mot de passe"
                    type="password"
                  />
                  <AppInput
                    id="confirmPassword"
                    v-model="passwordForm.confirmPassword"
                    label="Confirmer le mot de passe"
                    type="password"
                  />
                  <div class="pt-2">
                    <AppButton
                      variant="secondary"
                      :loading="savingPassword"
                      :disabled="!passwordForm.currentPassword || !passwordForm.newPassword"
                      @click="updatePassword"
                    >
                      Mettre à jour
                    </AppButton>
                    <p class="mt-2 text-xs text-slate-500">
                      8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un
                      caractère spécial.
                    </p>
                  </div>
                </div>
              </div>

              <TwoFactorSettings />
            </div>
          </div>

          <!-- TAB: NOTIFICATIONS -->
          <div v-if="activeTab === 'notifications'" class="space-y-8 animate-fade-in">
            <h2 class="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Icon name="tabler:bell-ringing" class="text-purple-600" />
              Catégories suivies
            </h2>

            <p class="text-sm text-slate-500">
              Suivez des catégories pour être notifié en temps réel dès qu'un nouveau tip y est
              publié. Les messages privés, badges et décisions de modération sont toujours notifiés.
            </p>

            <p v-if="categories.length === 0" class="text-sm text-slate-400">Chargement…</p>
            <div v-else class="space-y-3">
              <div
                v-for="category in categories"
                :key="category.id"
                class="flex items-center justify-between p-5 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-white/20 hover:bg-white/80 transition-colors"
              >
                <div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ category.name }}</div>
                  <div class="text-xs text-slate-500">
                    {{ category.description || `${category.tipsCount} tip(s) publié(s)` }}
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    :checked="category.isFollowed"
                    type="checkbox"
                    class="sr-only peer"
                    :aria-label="`Suivre ${category.name}`"
                    @change="toggleFollow(category)"
                  />
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
