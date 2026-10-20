<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TwoFactorSetup } from '~/types';
import AppButton from '~/components/ui/AppButton.vue';
import AppInput from '~/components/ui/AppInput.vue';
import { API_ROUTES } from '~/config/api';

const api = useApi();
const toast = useToastMessage();
const { user, getProfile } = useAuth();

const isEnabled = computed(() => !!user.value?.isTwoFactorEnabled);

// Activation : idle -> setup (QR code + saisie du code) -> backup (codes de secours à noter)
const step = ref<'idle' | 'setup' | 'backup'>('idle');
const setupData = ref<TwoFactorSetup | null>(null);
const backupCodes = ref<string[]>([]);
const code = ref('');
const password = ref('');
const loading = ref(false);

const startSetup = async () => {
  loading.value = true;
  try {
    setupData.value = await api.post<TwoFactorSetup>(API_ROUTES.TWO_FACTOR.SETUP);
    code.value = '';
    step.value = 'setup';
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    loading.value = false;
  }
};

const confirmSetup = async () => {
  loading.value = true;
  try {
    const result = await api.post<{ backupCodes: string[] }>(API_ROUTES.TWO_FACTOR.ENABLE, {
      code: code.value.trim(),
    });
    backupCodes.value = result.backupCodes;
    setupData.value = null;
    code.value = '';
    step.value = 'backup';
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    loading.value = false;
  }
};

const copyBackupCodes = async () => {
  try {
    await navigator.clipboard.writeText(backupCodes.value.join('\n'));
    toast.success('Codes de secours copiés');
  } catch {
    toast.error('Impossible de copier, notez les codes manuellement');
  }
};

const finishSetup = async () => {
  backupCodes.value = [];
  step.value = 'idle';
  await getProfile();
  toast.success('Double authentification activée');
};

const cancelSetup = () => {
  setupData.value = null;
  code.value = '';
  step.value = 'idle';
};

const disableTwoFactor = async () => {
  loading.value = true;
  try {
    await api.post(
      API_ROUTES.TWO_FACTOR.DISABLE,
      { password: password.value, code: code.value.trim() },
      { showSuccessToast: true, successMessage: 'Double authentification désactivée' },
    );
    password.value = '';
    code.value = '';
    await getProfile();
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="p-6 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-white/20 space-y-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          Double Authentification (2FA)
          <span
            v-if="isEnabled"
            class="px-2 py-0.5 rounded text-[10px] font-black bg-green-500/10 text-green-600 uppercase"
            >Activée</span
          >
          <span
            v-else
            class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-600 uppercase"
            >Recommandé</span
          >
        </div>
        <p class="text-sm text-slate-500 mt-1">
          À chaque connexion, un code généré par une application (Google Authenticator, Authy,
          Microsoft Authenticator…) vous sera demandé en plus du mot de passe.
        </p>
      </div>
    </div>

    <!-- 2FA désactivée : lancement de la configuration -->
    <div v-if="!isEnabled && step === 'idle'">
      <AppButton :loading="loading" @click="startSetup">
        <Icon name="tabler:shield-check" class="w-5 h-5" />
        Activer la double authentification
      </AppButton>
    </div>

    <!-- Étape 1 : scanner le QR code et confirmer avec un code -->
    <div v-else-if="step === 'setup' && setupData" class="space-y-4">
      <ol class="text-sm text-slate-600 dark:text-slate-300 list-decimal pl-5 space-y-1">
        <li>Scannez ce QR code avec votre application d'authentification.</li>
        <li>Saisissez le code à 6 chiffres affiché par l'application.</li>
      </ol>
      <div class="flex flex-col sm:flex-row items-start gap-6">
        <img
          :src="setupData.qrCode"
          alt="QR code de configuration 2FA"
          class="w-44 h-44 rounded-xl bg-white p-2 border border-slate-200"
        />
        <div class="space-y-3 flex-1 max-w-xs">
          <p class="text-xs text-slate-500">
            Impossible de scanner ? Saisissez cette clé dans l'application :
          </p>
          <code
            class="block break-all text-xs font-mono bg-slate-100 dark:bg-slate-900 rounded-lg p-2 select-all"
          >
            {{ setupData.secret }}
          </code>
          <AppInput
            id="two-factor-setup-code"
            v-model="code"
            label="Code de vérification"
            placeholder="123456"
          />
          <div class="flex gap-2">
            <AppButton
              :loading="loading"
              :disabled="code.trim().length !== 6"
              @click="confirmSetup"
            >
              Valider
            </AppButton>
            <AppButton variant="secondary" @click="cancelSetup">Annuler</AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Étape 2 : codes de secours, affichés une seule fois -->
    <div v-else-if="step === 'backup'" class="space-y-4">
      <div
        class="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300"
      >
        <strong>Notez ces codes de secours maintenant.</strong> Ils ne seront plus affichés. Chacun
        permet de se connecter une seule fois si vous perdez l'accès à votre application.
      </div>
      <ul class="grid grid-cols-2 gap-2 max-w-sm font-mono text-sm">
        <li
          v-for="backupCode in backupCodes"
          :key="backupCode"
          class="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-center select-all"
        >
          {{ backupCode }}
        </li>
      </ul>
      <div class="flex gap-2">
        <AppButton variant="secondary" @click="copyBackupCodes">
          <Icon name="tabler:copy" class="w-5 h-5" /> Copier
        </AppButton>
        <AppButton @click="finishSetup">J'ai noté mes codes</AppButton>
      </div>
    </div>

    <!-- 2FA activée : désactivation (mot de passe + code) -->
    <div v-else-if="isEnabled" class="space-y-4 max-w-md">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Pour désactiver la double authentification, confirmez avec votre mot de passe et un code de
        l'application (ou un code de secours).
      </p>
      <AppInput
        id="two-factor-disable-password"
        v-model="password"
        label="Mot de passe"
        type="password"
      />
      <AppInput
        id="two-factor-disable-code"
        v-model="code"
        label="Code 2FA ou code de secours"
        placeholder="123456"
      />
      <AppButton
        variant="secondary"
        :loading="loading"
        :disabled="!password || code.trim().length < 6"
        class="!bg-red-500/10 !text-red-500 hover:!bg-red-500/20 !border-red-500/20"
        @click="disableTwoFactor"
      >
        Désactiver la double authentification
      </AppButton>
    </div>
  </div>
</template>
