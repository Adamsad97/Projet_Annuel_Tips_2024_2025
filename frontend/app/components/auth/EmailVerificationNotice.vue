<script setup lang="ts">
// Encadré « vérifiez votre boîte mail » avec renvoi du lien (inscription, connexion, lien expiré)
const props = defineProps<{
  email?: string;
  title?: string;
}>();

const { resendVerificationEmail } = useAuth();

// L'API n'envoie pas plus d'un email par minute : on évite les clics inutiles
const COOLDOWN_SECONDS = 60;
const cooldown = ref(0);
const sending = ref(false);
const emailInput = ref(props.email ?? '');
let timer: ReturnType<typeof setInterval> | undefined;

const startCooldown = () => {
  cooldown.value = COOLDOWN_SECONDS;
  clearInterval(timer);
  timer = setInterval(() => {
    cooldown.value -= 1;
    if (cooldown.value <= 0) clearInterval(timer);
  }, 1000);
};
onBeforeUnmount(() => clearInterval(timer));

const resend = async () => {
  const email = emailInput.value.trim();
  if (!email || sending.value || cooldown.value > 0) return;
  sending.value = true;
  if (await resendVerificationEmail(email)) startCooldown();
  sending.value = false;
};
</script>

<template>
  <div
    class="space-y-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 p-5 text-sm"
  >
    <div class="flex items-start gap-3">
      <Icon name="tabler:mail-check" class="w-6 h-6 shrink-0 text-emerald-600" />
      <div class="space-y-1">
        <p class="font-bold text-slate-900 dark:text-white">
          {{ title ?? 'Vérifiez votre boîte mail' }}
        </p>
        <p class="text-gray-600 dark:text-gray-300">
          <template v-if="email">
            Un lien d’activation a été envoyé à <strong>{{ email }}</strong
            >.
          </template>
          Cliquez dessus pour activer votre compte (valable 24 h), puis connectez-vous. Pensez à
          regarder dans les courriers indésirables.
        </p>
      </div>
    </div>

    <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="resend">
      <input
        v-if="!email"
        v-model="emailInput"
        type="email"
        required
        placeholder="Votre adresse email"
        aria-label="Adresse email du compte"
        class="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <button
        type="submit"
        :disabled="sending || cooldown > 0"
        class="px-4 py-2 rounded-xl font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{
          cooldown > 0
            ? `Renvoyer l’email (${cooldown} s)`
            : sending
              ? 'Envoi…'
              : 'Renvoyer l’email'
        }}
      </button>
    </form>
  </div>
</template>
