<script setup lang="ts">
import { ref, watch } from 'vue';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  userId: number | null;
  handledAt: string | null;
  createdAt: string;
}

const api = useApi();

const messages = ref<ContactMessage[]>([]);
const showHandled = ref(false);
const loading = ref(false);

const loadMessages = async () => {
  loading.value = true;
  try {
    messages.value = await api.get<ContactMessage[]>(
      `${API_ROUTES.ADMIN.CONTACT_MESSAGES}?status=${showHandled.value ? 'all' : 'open'}`,
    );
  } catch {
    messages.value = [];
  } finally {
    loading.value = false;
  }
};

const setHandled = async (message: ContactMessage, handled: boolean) => {
  try {
    await api.patch(API_ROUTES.ADMIN.CONTACT_MESSAGE(message.id), { handled });
    await loadMessages();
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

const remove = async (message: ContactMessage) => {
  if (!confirm(`Supprimer le message de ${message.name} ?`)) return;
  try {
    await api.delete(API_ROUTES.ADMIN.CONTACT_MESSAGE(message.id), {
      showSuccessToast: true,
      successMessage: 'Message supprimé',
    });
    await loadMessages();
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

// Réponse par e-mail depuis le logiciel de messagerie de l'admin
const replyLink = (message: ContactMessage) =>
  `mailto:${message.email}?subject=${encodeURIComponent('Re: votre message à AideFlash')}`;

const formatDate = (date: string) => new Date(date).toLocaleString('fr-FR');

watch(showHandled, loadMessages);
onMounted(loadMessages);
</script>

<template>
  <div class="space-y-4">
    <label class="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <input v-model="showHandled" type="checkbox" /> Afficher aussi les messages traités
    </label>

    <p v-if="loading" class="text-slate-400">Chargement…</p>
    <p v-else-if="messages.length === 0" class="text-slate-500">Aucun message.</p>

    <ul v-else class="space-y-4">
      <li
        v-for="message in messages"
        :key="message.id"
        class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5 space-y-3"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="font-bold text-slate-900 dark:text-white">
            {{ message.name }}
            <span class="font-normal text-slate-500">&lt;{{ message.email }}&gt;</span>
            <NuxtLink
              v-if="message.userId"
              :to="ROUTES.USER_PROFILE(message.userId)"
              class="ml-2 text-xs font-normal text-purple-600 hover:underline"
            >
              voir le membre
            </NuxtLink>
          </div>
          <span class="text-xs text-slate-500">{{ formatDate(message.createdAt) }}</span>
        </div>

        <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
          {{ message.message }}
        </p>

        <div class="flex flex-wrap items-center gap-4 text-sm font-bold">
          <a :href="replyLink(message)" class="text-purple-600 hover:underline">Répondre</a>
          <button
            v-if="!message.handledAt"
            type="button"
            class="text-emerald-600 hover:underline"
            @click="setHandled(message, true)"
          >
            Marquer comme traité
          </button>
          <template v-else>
            <span class="text-xs font-normal text-slate-500">
              Traité le {{ formatDate(message.handledAt) }}
            </span>
            <button
              type="button"
              class="text-slate-500 hover:underline"
              @click="setHandled(message, false)"
            >
              Rouvrir
            </button>
          </template>
          <button
            type="button"
            class="ml-auto text-red-500 hover:underline"
            @click="remove(message)"
          >
            Supprimer
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
