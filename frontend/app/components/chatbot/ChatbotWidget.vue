<script setup lang="ts">
import { ref, nextTick } from 'vue';
import type { ChatbotAnswer } from '~/types';
import { API_ROUTES } from '~/config/api';
import { ROUTES } from '~/config/routes';

// Assistant flottant : propose les tips les plus utiles pour le problème décrit
type ChatEntry =
  | { from: 'user'; text: string }
  | { from: 'bot'; text: string; reply?: ChatbotAnswer; question?: string };

const MAX_QUESTION_LENGTH = 500;

const api = useApi();
const isOpen = ref(false);
const entries = ref<ChatEntry[]>([]);
const question = ref('');
const thinking = ref(false);
const scrollArea = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
  await nextTick();
  scrollArea.value?.scrollTo({ top: scrollArea.value.scrollHeight, behavior: 'smooth' });
};

const open = async () => {
  isOpen.value = true;
  if (entries.value.length === 0) {
    try {
      const { greeting } = await api.get<{ greeting: string }>(API_ROUTES.CHATBOT.CONFIG, {
        showErrorToast: false,
      });
      entries.value.push({ from: 'bot', text: greeting });
    } catch {
      entries.value.push({ from: 'bot', text: 'Décrivez votre problème en quelques mots.' });
    }
  }
  await scrollToBottom();
};

const send = async () => {
  const text = question.value.trim();
  if (text.length < 3 || thinking.value) return;

  entries.value.push({ from: 'user', text });
  question.value = '';
  thinking.value = true;
  await scrollToBottom();

  try {
    const reply = await api.post<ChatbotAnswer>(
      API_ROUTES.CHATBOT.ASK,
      { question: text },
      { showErrorToast: false },
    );
    entries.value.push({ from: 'bot', text: reply.answer, reply, question: text });
  } catch {
    entries.value.push({
      from: 'bot',
      text: 'Je ne peux pas répondre pour le moment, réessayez dans un instant.',
    });
  } finally {
    thinking.value = false;
    await scrollToBottom();
  }
};

// Pré-remplit le formulaire de question avec ce que l'utilisateur a demandé
const askCommunityLink = (text?: string) => ({
  path: ROUTES.TIP_CREATE,
  query: { kind: 'QUESTION', title: text?.slice(0, 200) },
});
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[900]">
    <!-- Panneau de discussion -->
    <div
      v-if="isOpen"
      class="mb-3 w-[22rem] max-w-[calc(100vw-2rem)] h-[32rem] max-h-[70vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-purple-200/60 dark:border-slate-700 bg-white dark:bg-slate-900"
      role="dialog"
      aria-label="Assistant AideFlash"
    >
      <header
        class="flex items-center justify-between px-4 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white"
      >
        <div class="flex items-center gap-2 font-bold">
          <Icon name="tabler:robot" class="w-5 h-5" /> Assistant AideFlash
        </div>
        <button type="button" aria-label="Fermer" @click="isOpen = false">
          <Icon name="tabler:x" class="w-5 h-5" />
        </button>
      </header>

      <div ref="scrollArea" class="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        <div
          v-for="(entry, index) in entries"
          :key="index"
          class="flex"
          :class="entry.from === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-2xl px-3 py-2"
            :class="
              entry.from === 'user'
                ? 'bg-purple-600 text-white rounded-br-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md'
            "
          >
            <p class="whitespace-pre-line">{{ entry.text }}</p>

            <template v-if="entry.from === 'bot' && entry.reply">
              <!-- Tips proposés -->
              <ul v-if="entry.reply.tips.length > 0" class="mt-2 space-y-2">
                <li v-for="tip in entry.reply.tips" :key="tip.id">
                  <NuxtLink
                    :to="ROUTES.TIP_DETAIL(tip.id)"
                    class="block rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition"
                    @click="isOpen = false"
                  >
                    <span class="block font-bold text-purple-700 dark:text-purple-300">
                      {{ tip.title }}
                    </span>
                    <span class="block text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {{ tip.snippet }}
                    </span>
                    <span class="flex gap-2 text-[11px] text-slate-400 mt-1">
                      <span v-if="tip.categories.length">#{{ tip.categories.join(' #') }}</span>
                      <span>{{ tip.upvotes }} vote(s) utile</span>
                    </span>
                  </NuxtLink>
                </li>
              </ul>

              <NuxtLink
                v-if="entry.reply.link"
                :to="entry.reply.link"
                class="inline-block mt-2 text-xs font-bold text-purple-600 hover:underline"
                @click="isOpen = false"
              >
                Ouvrir la page →
              </NuxtLink>

              <p v-if="entry.reply.context" class="mt-2 text-xs italic text-slate-500">
                {{ entry.reply.context }}
              </p>

              <NuxtLink
                v-if="entry.reply.suggestAskingCommunity"
                :to="askCommunityLink(entry.question)"
                class="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700"
                @click="isOpen = false"
              >
                <Icon name="tabler:help-circle" class="w-4 h-4" /> Poser la question à la communauté
              </NuxtLink>
            </template>
          </div>
        </div>

        <div v-if="thinking" class="text-xs text-slate-400 italic">L'assistant cherche…</div>
      </div>

      <form
        class="flex gap-2 p-3 border-t border-slate-200 dark:border-slate-800"
        @submit.prevent="send"
      >
        <input
          v-model="question"
          type="text"
          :maxlength="MAX_QUESTION_LENGTH"
          placeholder="Ex : enlever une tache de vin"
          class="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          :disabled="thinking || question.trim().length < 3"
          class="px-3 rounded-xl bg-purple-600 text-white disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Icon name="tabler:send" class="w-5 h-5" />
        </button>
      </form>
    </div>

    <!-- Bulle d'ouverture -->
    <button
      v-if="!isOpen"
      type="button"
      class="w-14 h-14 rounded-full bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/30 hover:scale-110 transition flex items-center justify-center"
      aria-label="Ouvrir l'assistant"
      @click="open"
    >
      <Icon name="tabler:message-chatbot" class="w-7 h-7" />
    </button>
  </div>
</template>
