<script setup lang="ts">
import EmailVerificationNotice from '~/components/auth/EmailVerificationNotice.vue';
import { ROUTES } from '~/config/routes';

// Page ouverte depuis le lien reçu par email : /auth/verify-email?token=...
definePageMeta({ layout: 'auth' });
useSeoMeta({ title: 'Activation du compte', robots: 'noindex' });

const route = useRoute();
const { verifyEmail } = useAuth();

const status = ref<'pending' | 'verified' | 'failed'>('pending');

// Côté client uniquement : un aperçu du lien (messagerie, antivirus) ne doit pas l'utiliser
onMounted(async () => {
  const token = route.query.token;
  status.value = typeof token === 'string' && (await verifyEmail(token)) ? 'verified' : 'failed';
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div
      class="w-full max-w-md bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700 shadow-2xl p-8 space-y-6 text-center relative overflow-hidden"
    >
      <div class="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-emerald-400 to-teal-500" />

      <template v-if="status === 'pending'">
        <Icon name="svg-spinners:180-ring" class="w-10 h-10 text-emerald-600 mx-auto" />
        <p class="text-gray-600 dark:text-gray-300">Activation de votre compte…</p>
      </template>

      <template v-else-if="status === 'verified'">
        <Icon name="tabler:circle-check" class="w-14 h-14 text-emerald-600 mx-auto" />
        <h1 class="text-2xl font-black text-slate-900 dark:text-white">Compte activé !</h1>
        <p class="text-gray-600 dark:text-gray-300">
          Votre adresse email est confirmée. Vous pouvez maintenant vous connecter.
        </p>
        <NuxtLink
          :to="ROUTES.LOGIN"
          class="inline-block w-full py-3 rounded-xl font-bold text-white bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
        >
          Se connecter
        </NuxtLink>
      </template>

      <template v-else>
        <Icon name="tabler:link-off" class="w-14 h-14 text-amber-500 mx-auto" />
        <h1 class="text-2xl font-black text-slate-900 dark:text-white">Lien invalide ou expiré</h1>
        <p class="text-gray-600 dark:text-gray-300">
          Ce lien a peut-être déjà servi, ou il a plus de 24 h. Si votre compte est déjà activé,
          connectez-vous ; sinon, demandez un nouveau lien.
        </p>
        <EmailVerificationNotice title="Recevoir un nouveau lien" class="text-left" />
        <NuxtLink :to="ROUTES.LOGIN" class="block font-bold text-emerald-600 hover:underline">
          Aller à la connexion
        </NuxtLink>
      </template>
    </div>
  </div>
</template>
