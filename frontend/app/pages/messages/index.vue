<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type {
  ChatMessage,
  ChatUser,
  ConversationDetail,
  ConversationSummary,
  ConversationWith,
  SendRestriction,
} from '~/types';
import ProfilPicture from '~/components/ProfilPicture.vue';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

definePageMeta({
  middleware: 'auth',
});

useSeoMeta({ title: 'Messages' });

const MAX_MESSAGE_LENGTH = 2000;

const api = useApi();
const route = useRoute();
const router = useRouter();
const realtime = useRealtime();

const conversations = ref<ConversationSummary[]>([]);
const loadingList = ref(true);

// Fil affiché : conversation existante, ou nouveau fil ouvert depuis un profil (?to=)
const activeConversationId = ref<number | null>(null);
const otherUser = ref<ChatUser | null>(null);
const restriction = ref<SendRestriction>(null);
const messages = ref<ChatMessage[]>([]);
const loadingThread = ref(false);

const draft = ref('');
const sending = ref(false);
const editingId = ref<number | null>(null);
const editDraft = ref('');
const threadEnd = ref<HTMLElement | null>(null);

const RESTRICTION_MESSAGES: Record<Exclude<SendRestriction, null>, string> = {
  you_blocked: 'Vous avez bloqué ce membre. Débloquez-le pour lui écrire.',
  blocked: 'Vous ne pouvez pas envoyer de message à ce membre.',
  waiting_reply: 'Attendez sa réponse avant d’envoyer un autre message.',
};

const nameOf = (user: ChatUser | null) =>
  user ? [user.firstname, user.lastname].filter(Boolean).join(' ') || user.username : 'Membre';

const formatTime = (date: string) =>
  new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const hasThread = computed(() => otherUser.value !== null);

const scrollToBottom = async () => {
  await nextTick();
  threadEnd.value?.scrollIntoView({ block: 'end' });
};

const loadConversations = async () => {
  try {
    conversations.value = await api.get<ConversationSummary[]>(API_ROUTES.MESSAGING.CONVERSATIONS);
  } catch {
    conversations.value = [];
  } finally {
    loadingList.value = false;
  }
};

const openConversation = async (conversationId: number) => {
  loadingThread.value = true;
  try {
    const detail = await api.get<ConversationDetail>(
      API_ROUTES.MESSAGING.CONVERSATION(conversationId),
    );
    activeConversationId.value = detail.id;
    otherUser.value = detail.otherUser;
    restriction.value = detail.restriction;
    messages.value = detail.messages;
    // L'ouverture marque la conversation comme lue
    const summary = conversations.value.find((c) => c.id === conversationId);
    if (summary) summary.unreadCount = 0;
    await scrollToBottom();
  } catch {
    await router.replace({ query: {} });
  } finally {
    loadingThread.value = false;
  }
};

const openThreadWith = async (userId: number) => {
  loadingThread.value = true;
  try {
    const data = await api.get<ConversationWith>(API_ROUTES.MESSAGING.CONVERSATION_WITH(userId));
    if (data.conversationId) {
      await router.replace({ query: { c: data.conversationId } });
      return;
    }
    activeConversationId.value = null;
    otherUser.value = data.otherUser;
    restriction.value = data.restriction;
    messages.value = [];
  } catch {
    await router.replace({ query: {} });
  } finally {
    loadingThread.value = false;
  }
};

const resetThread = () => {
  activeConversationId.value = null;
  otherUser.value = null;
  restriction.value = null;
  messages.value = [];
};

// La conversation affichée suit l'URL (?c=12 ou ?to=5)
watch(
  () => [route.query.c, route.query.to],
  ([c, to]) => {
    editingId.value = null;
    draft.value = '';
    if (c) return openConversation(Number(c));
    if (to) return openThreadWith(Number(to));
    resetThread();
  },
  { immediate: true },
);

const sendMessage = async () => {
  const content = draft.value.trim();
  if (!content || !otherUser.value || sending.value) return;

  sending.value = true;
  try {
    const result = await api.post<{ conversationId: number; message: ChatMessage }>(
      API_ROUTES.MESSAGING.MESSAGES,
      { recipientId: otherUser.value.id, content },
    );
    draft.value = '';

    if (activeConversationId.value !== result.conversationId) {
      await router.replace({ query: { c: result.conversationId } });
    } else {
      // Recharge le fil : le serveur indique si un nouveau message est possible (attente de réponse)
      await openConversation(result.conversationId);
    }
    await loadConversations();
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    sending.value = false;
  }
};

const startEdit = (message: ChatMessage) => {
  editingId.value = message.id;
  editDraft.value = message.content;
};

const saveEdit = async () => {
  if (!editingId.value || !editDraft.value.trim()) return;

  try {
    const updated = await api.patch<ChatMessage>(API_ROUTES.MESSAGING.MESSAGE(editingId.value), {
      content: editDraft.value.trim(),
    });
    messages.value = messages.value.map((m) => (m.id === updated.id ? updated : m));
    editingId.value = null;
  } catch {
    // ex: message lu entre-temps, l'erreur est affichée par useApi
    if (activeConversationId.value) await openConversation(activeConversationId.value);
    editingId.value = null;
  }
};

const refreshThread = async () => {
  if (activeConversationId.value) {
    await openConversation(activeConversationId.value);
  } else if (otherUser.value) {
    await openThreadWith(otherUser.value.id);
  }
};

const toggleBlock = async () => {
  if (!otherUser.value) return;

  const isBlocking = restriction.value !== 'you_blocked';
  if (
    isBlocking &&
    !confirm(`Bloquer ${nameOf(otherUser.value)} ? Vous ne pourrez plus échanger de messages.`)
  ) {
    return;
  }

  try {
    if (isBlocking) {
      await api.post(API_ROUTES.MESSAGING.BLOCK(otherUser.value.id), undefined, {
        showSuccessToast: true,
        successMessage: 'Membre bloqué',
      });
    } else {
      await api.delete(API_ROUTES.MESSAGING.BLOCK(otherUser.value.id), {
        showSuccessToast: true,
        successMessage: 'Membre débloqué',
      });
    }
    await refreshThread();
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

// Temps réel : nouveaux messages, modifications et accusés de lecture
const unsubscribers = [
  realtime.on<{ conversationId: number }>('message:new', async ({ conversationId }) => {
    if (conversationId === activeConversationId.value) {
      await openConversation(conversationId);
    }
    await loadConversations();
  }),
  realtime.on<{ conversationId: number; message: ChatMessage }>(
    'message:updated',
    ({ conversationId, message }) => {
      if (conversationId !== activeConversationId.value) return;
      messages.value = messages.value.map((m) => (m.id === message.id ? message : m));
    },
  ),
  realtime.on<{ conversationId: number; readAt: string }>(
    'conversation:read',
    ({ conversationId, readAt }) => {
      if (conversationId !== activeConversationId.value) return;
      messages.value = messages.value.map((m) =>
        m.isMine && new Date(m.createdAt) <= new Date(readAt)
          ? { ...m, isRead: true, canEdit: false }
          : m,
      );
      if (editingId.value && !messages.value.find((m) => m.id === editingId.value)?.canEdit) {
        editingId.value = null;
      }
    },
  ),
];

onMounted(loadConversations);
onUnmounted(() => unsubscribers.forEach((unsubscribe) => unsubscribe()));
</script>

<template>
  <div class="max-w-6xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-black text-slate-900 dark:text-white mb-6">Messages</h1>

    <div
      class="grid grid-cols-1 md:grid-cols-[18rem_1fr] rounded-3xl overflow-hidden border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl shadow-xl"
      style="min-height: 32rem"
    >
      <!-- Liste des conversations -->
      <aside
        class="border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-slate-800"
        :class="{ 'hidden md:block': hasThread }"
      >
        <p v-if="loadingList" class="p-4 text-sm text-slate-400">Chargement…</p>
        <p v-else-if="conversations.length === 0" class="p-4 text-sm text-slate-500">
          Aucune conversation. Ouvrez le profil d'un membre pour lui écrire.
        </p>
        <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="conversation in conversations" :key="conversation.id">
            <NuxtLink
              :to="{ query: { c: conversation.id } }"
              class="flex items-center gap-3 px-4 py-3 hover:bg-white/70 dark:hover:bg-slate-800/60 transition"
              :class="{
                'bg-purple-50 dark:bg-purple-900/20': conversation.id === activeConversationId,
              }"
            >
              <ProfilPicture
                :src="conversation.otherUser?.avatarProfile || undefined"
                :online="false"
                class="shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {{ nameOf(conversation.otherUser) }}
                  </span>
                  <span
                    v-if="conversation.unreadCount > 0"
                    class="min-w-5 h-5 px-1 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center"
                  >
                    {{ conversation.unreadCount }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 truncate">
                  {{ conversation.lastMessage?.content }}
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </aside>

      <!-- Fil de discussion -->
      <section class="flex flex-col min-h-[32rem]" :class="{ 'hidden md:flex': !hasThread }">
        <div
          v-if="!hasThread"
          class="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 p-8"
        >
          <Icon name="tabler:messages" class="w-12 h-12" />
          <p class="text-sm">Sélectionnez une conversation</p>
        </div>

        <template v-else-if="otherUser">
          <!-- En-tête -->
          <header
            class="flex items-center gap-3 px-4 py-3 border-b border-slate-200/60 dark:border-slate-800"
          >
            <NuxtLink
              :to="{ query: {} }"
              class="md:hidden text-slate-500 hover:text-purple-600"
              aria-label="Retour"
            >
              <Icon name="tabler:arrow-left" class="w-5 h-5" />
            </NuxtLink>
            <NuxtLink
              :to="ROUTES.USER_PROFILE(otherUser.id)"
              class="flex items-center gap-3 flex-1 min-w-0 group"
            >
              <ProfilPicture :src="otherUser.avatarProfile || undefined" :online="false" />
              <span
                class="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-purple-600"
              >
                {{ nameOf(otherUser) }}
              </span>
            </NuxtLink>
            <button
              type="button"
              class="text-xs font-bold px-3 py-1.5 rounded-lg border transition"
              :class="
                restriction === 'you_blocked'
                  ? 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  : 'border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              "
              @click="toggleBlock"
            >
              {{ restriction === 'you_blocked' ? 'Débloquer' : 'Bloquer' }}
            </button>
          </header>

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[28rem]">
            <p v-if="loadingThread" class="text-sm text-slate-400">Chargement…</p>
            <p v-else-if="messages.length === 0" class="text-sm text-slate-500 text-center mt-8">
              Démarrez la conversation. Tant que {{ nameOf(otherUser) }} n'a pas répondu, vous ne
              pouvez envoyer qu'un seul message.
            </p>
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex"
              :class="message.isMine ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm"
                :class="
                  message.isMine
                    ? 'bg-purple-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md'
                "
              >
                <template v-if="editingId === message.id">
                  <textarea
                    v-model="editDraft"
                    :maxlength="MAX_MESSAGE_LENGTH"
                    rows="2"
                    class="w-64 max-w-full p-2 rounded-lg text-slate-800 bg-white outline-none"
                  />
                  <div class="flex justify-end gap-2 mt-1 text-xs">
                    <button
                      type="button"
                      class="opacity-80 hover:opacity-100"
                      @click="editingId = null"
                    >
                      Annuler
                    </button>
                    <button type="button" class="font-bold" @click="saveEdit">Enregistrer</button>
                  </div>
                </template>
                <p v-else class="whitespace-pre-line break-words">{{ message.content }}</p>
                <div
                  class="flex items-center justify-end gap-2 mt-1 text-[10px]"
                  :class="message.isMine ? 'text-purple-200' : 'text-slate-400'"
                >
                  <span>{{ formatTime(message.createdAt) }}</span>
                  <span v-if="message.editedAt">· modifié</span>
                  <template v-if="message.isMine">
                    <span>· {{ message.isRead ? 'Lu' : 'Envoyé' }}</span>
                    <button
                      v-if="message.canEdit && editingId !== message.id"
                      type="button"
                      class="underline hover:text-white"
                      @click="startEdit(message)"
                    >
                      Modifier
                    </button>
                  </template>
                </div>
              </div>
            </div>
            <div ref="threadEnd" />
          </div>

          <!-- Saisie -->
          <footer class="border-t border-slate-200/60 dark:border-slate-800 p-3">
            <p
              v-if="restriction"
              class="text-sm text-center text-slate-500 dark:text-slate-400 py-2"
            >
              {{ RESTRICTION_MESSAGES[restriction] }}
            </p>
            <form v-else class="flex gap-2" @submit.prevent="sendMessage">
              <textarea
                v-model="draft"
                :maxlength="MAX_MESSAGE_LENGTH"
                rows="2"
                placeholder="Votre message…"
                class="flex-1 p-3 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                @keydown.enter.exact.prevent="sendMessage"
              />
              <button
                type="submit"
                :disabled="sending || !draft.trim()"
                class="self-end px-4 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50"
                aria-label="Envoyer"
              >
                <Icon name="tabler:send" class="w-5 h-5" />
              </button>
            </form>
          </footer>
        </template>
      </section>
    </div>
  </div>
</template>
