<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { ChatbotCannedResponse, ChatbotConfig, ChatbotQueryLog } from '~/types';
import { API_ROUTES } from '~/config/api';

const api = useApi();
const toast = useToastMessage();

const config = reactive<ChatbotConfig>({ greeting: '', fallbackMessage: '', contextNote: '' });
const responses = ref<ChatbotCannedResponse[]>([]);
const queries = ref<ChatbotQueryLog[]>([]);
const onlyUnanswered = ref(true);
const saving = ref(false);

// Formulaire de réponse type (création ou modification)
const emptyDraft = () => ({
  id: null as number | null,
  keywords: '',
  answer: '',
  link: '',
  priority: 0,
  isActive: true,
});
const draft = reactive(emptyDraft());

const loadQueries = async () => {
  try {
    queries.value = await api.get<ChatbotQueryLog[]>(
      `${API_ROUTES.ADMIN.CHATBOT_QUERIES}?unanswered=${onlyUnanswered.value}`,
    );
  } catch {
    queries.value = [];
  }
};

const load = async () => {
  try {
    const [currentConfig, cannedResponses] = await Promise.all([
      api.get<ChatbotConfig>(API_ROUTES.ADMIN.CHATBOT_CONFIG),
      api.get<ChatbotCannedResponse[]>(API_ROUTES.ADMIN.CHATBOT_RESPONSES),
    ]);
    Object.assign(config, { ...currentConfig, contextNote: currentConfig.contextNote ?? '' });
    responses.value = cannedResponses;
  } catch {
    // l'erreur est déjà affichée par useApi
  }
  await loadQueries();
};

const withSaving = async (action: () => Promise<unknown>, message: string) => {
  saving.value = true;
  try {
    await action();
    toast.success(message);
    return true;
  } catch {
    return false;
  } finally {
    saving.value = false;
  }
};

const saveConfig = () =>
  withSaving(
    () =>
      api.patch(API_ROUTES.ADMIN.CHATBOT_CONFIG, {
        greeting: config.greeting,
        fallbackMessage: config.fallbackMessage,
        contextNote: config.contextNote ?? '',
      }),
    'Réglages du chatbot enregistrés',
  );

const editResponse = (response: ChatbotCannedResponse) => {
  Object.assign(draft, {
    id: response.id,
    keywords: response.keywords.join(', '),
    answer: response.answer,
    link: response.link ?? '',
    priority: response.priority,
    isActive: response.isActive,
  });
};

// Prépare une réponse type à partir d'une question restée sans réponse
const answerQuery = (query: ChatbotQueryLog) => {
  Object.assign(draft, emptyDraft(), { keywords: query.question.slice(0, 60) });
};

const saveResponse = async () => {
  const body = {
    keywords: draft.keywords
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    answer: draft.answer.trim(),
    link: draft.link.trim() || (draft.id ? null : undefined),
    priority: Number(draft.priority),
    isActive: draft.isActive,
  };

  const done = await withSaving(
    () =>
      draft.id
        ? api.patch(API_ROUTES.ADMIN.CHATBOT_RESPONSE(draft.id), body)
        : api.post(API_ROUTES.ADMIN.CHATBOT_RESPONSES, body),
    draft.id ? 'Réponse mise à jour' : 'Réponse créée',
  );
  if (done) {
    Object.assign(draft, emptyDraft());
    await load();
  }
};

const deleteResponse = async (response: ChatbotCannedResponse) => {
  if (!confirm('Supprimer cette réponse type ?')) return;
  if (
    await withSaving(
      () => api.delete(API_ROUTES.ADMIN.CHATBOT_RESPONSE(response.id)),
      'Réponse supprimée',
    )
  ) {
    await load();
  }
};

watch(onlyUnanswered, loadQueries);
onMounted(load);
</script>

<template>
  <div class="space-y-10">
    <!-- Réglages -->
    <section class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5 space-y-4">
      <h3 class="text-lg font-bold text-slate-900 dark:text-white">Réglages</h3>
      <label class="block text-sm">
        <span class="font-medium">Message d'accueil</span>
        <textarea
          v-model="config.greeting"
          rows="2"
          class="mt-1 w-full p-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">Message quand aucun tip ne correspond</span>
        <textarea
          v-model="config.fallbackMessage"
          rows="2"
          class="mt-1 w-full p-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">Contexte ajouté aux réponses (optionnel)</span>
        <textarea
          v-model="config.contextNote"
          rows="2"
          placeholder="Ex : pensez à voter « utile » sur les tips qui vous aident."
          class="mt-1 w-full p-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700"
        />
      </label>
      <button
        type="button"
        class="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
        :disabled="saving"
        @click="saveConfig"
      >
        Enregistrer
      </button>
    </section>

    <!-- Réponses types -->
    <section class="space-y-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Réponses types</h3>
        <p class="text-sm text-slate-500">
          Une réponse se déclenche quand tous les mots d'un de ses mots-clés sont dans la question
          (insensible aux accents). La priorité départage plusieurs réponses possibles.
        </p>
      </div>

      <ul class="space-y-2">
        <li
          v-for="response in responses"
          :key="response.id"
          class="rounded-xl bg-white/70 dark:bg-slate-800/60 p-4 flex flex-wrap items-start justify-between gap-3"
          :class="{ 'opacity-50': !response.isActive }"
        >
          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="keyword in response.keywords"
                :key="keyword"
                class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-bold"
              >
                {{ keyword }}
              </span>
            </div>
            <p class="text-sm text-slate-700 dark:text-slate-200">{{ response.answer }}</p>
            <p class="text-xs text-slate-400">
              Priorité {{ response.priority }}
              <template v-if="response.link"> · lien {{ response.link }}</template>
              <template v-if="!response.isActive"> · désactivée</template>
            </p>
          </div>
          <div class="flex gap-3 text-xs font-bold">
            <button class="text-purple-600 hover:underline" @click="editResponse(response)">
              Modifier
            </button>
            <button class="text-red-500 hover:underline" @click="deleteResponse(response)">
              Supprimer
            </button>
          </div>
        </li>
      </ul>

      <!-- Formulaire -->
      <div
        class="rounded-2xl border-2 border-dashed border-purple-200 dark:border-slate-700 p-4 space-y-3"
      >
        <h4 class="font-bold text-sm">
          {{ draft.id ? 'Modifier la réponse type' : 'Nouvelle réponse type' }}
        </h4>
        <input
          v-model="draft.keywords"
          placeholder="Mots-clés séparés par des virgules (ex : mot de passe, password)"
          class="w-full p-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700"
        />
        <textarea
          v-model="draft.answer"
          rows="3"
          placeholder="Réponse du chatbot"
          class="w-full p-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700"
        />
        <div class="flex flex-wrap gap-3 items-center text-sm">
          <input
            v-model="draft.link"
            placeholder="Lien interne (ex : /settings)"
            class="flex-1 min-w-[12rem] p-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700"
          />
          <label class="flex items-center gap-2">
            Priorité
            <input
              v-model.number="draft.priority"
              type="number"
              min="0"
              max="100"
              class="w-20 p-2 rounded-xl border dark:bg-slate-900 dark:border-slate-700"
            />
          </label>
          <label class="flex items-center gap-2">
            <input v-model="draft.isActive" type="checkbox" /> Active
          </label>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
            :disabled="saving || !draft.keywords.trim() || draft.answer.trim().length < 5"
            @click="saveResponse"
          >
            {{ draft.id ? 'Enregistrer' : 'Ajouter' }}
          </button>
          <button
            v-if="draft.id"
            type="button"
            class="px-4 py-2 rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            @click="Object.assign(draft, emptyDraft())"
          >
            Annuler
          </button>
        </div>
      </div>
    </section>

    <!-- Questions posées -->
    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Questions posées</h3>
        <label class="text-sm flex items-center gap-2">
          <input v-model="onlyUnanswered" type="checkbox" /> Seulement celles sans réponse
        </label>
      </div>
      <p v-if="queries.length === 0" class="text-sm text-slate-500">Aucune question.</p>
      <ul
        v-else
        class="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl bg-white/70 dark:bg-slate-800/60"
      >
        <li
          v-for="query in queries"
          :key="query.id"
          class="px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm"
        >
          <div>
            <p class="text-slate-800 dark:text-slate-100">{{ query.question }}</p>
            <p class="text-xs text-slate-400">
              {{ query.user?.username ?? 'membre supprimé' }} ·
              {{ new Date(query.createdAt).toLocaleString('fr-FR') }} · {{ query.tipsFound }} tip(s)
              trouvé(s)
              <template v-if="query.cannedResponseId"> · réponse type</template>
            </p>
          </div>
          <button
            class="text-xs font-bold text-purple-600 hover:underline"
            @click="answerQuery(query)"
          >
            Créer une réponse type
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
