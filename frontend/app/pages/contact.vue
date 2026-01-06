<script setup lang="ts">
import { ref } from 'vue';

const form = ref({ name: '', email: '', message: '' });
const loading = ref(false);
const sent = ref(false);

const submit = async () => {
  loading.value = true;
  await new Promise((r) => setTimeout(r, 1500)); // Simule l'envoi
  loading.value = false;
  sent.value = true;
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div
      class="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700 shadow-2xl p-8 md:p-12"
    >
      <!-- Info Side -->
      <div class="space-y-8">
        <div>
          <h1 class="text-4xl font-black text-slate-900 dark:text-white mb-4">Contactez-nous</h1>
          <p class="text-gray-600 dark:text-gray-300 text-lg">
            Une question, un bug ou une suggestion ? L'équipe est à votre écoute.
          </p>
        </div>

        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600"
            >
              <Icon name="tabler:mail" class="w-6 h-6" />
            </div>
            <div>
              <div class="font-bold text-slate-800 dark:text-white">Email</div>
              <div class="text-gray-500">support@aideflash.fr</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500"
            >
              <Icon name="tabler:brand-discord" class="w-6 h-6" />
            </div>
            <div>
              <div class="font-bold text-slate-800 dark:text-white">Discord</div>
              <div class="text-gray-500">Rejoindre le serveur</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Side -->
      <form class="space-y-6" @submit.prevent="submit">
        <div
          v-if="sent"
          class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-xl flex items-center gap-3 animate-fade-in"
        >
          <Icon name="tabler:check" /> Message envoyé avec succès !
        </div>

        <template v-else>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-500 uppercase">Nom</label>
              <input
                v-model="form.name"
                required
                type="text"
                class="w-full bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-gray-500 uppercase">Email</label>
              <input
                v-model="form.email"
                required
                type="email"
                class="w-full bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold text-gray-500 uppercase">Message</label>
            <textarea
              v-model="form.message"
              required
              rows="4"
              class="w-full bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>

          <button
            :disabled="loading"
            type="submit"
            class="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!loading">Envoyer le message</span>
            <Icon v-else name="tabler:loader" class="animate-spin" />
          </button>
        </template>
      </form>
    </div>
  </div>
</template>
