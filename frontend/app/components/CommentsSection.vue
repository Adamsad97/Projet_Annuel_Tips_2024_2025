<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { ApiComment } from '~/types';
import CommentItem from '~/components/CommentItem.vue';
import { API_ROUTES } from '~/config/api';

const props = withDefaults(
  defineProps<{
    tipId: number;
    // Sur une question, les commentaires sont les réponses de la communauté
    title?: string;
  }>(),
  { title: 'Discussion' },
);

const MAX_COMMENT_LENGTH = 2000;

const api = useApi();
const { user: currentUser, isAuthenticated } = useAuth();

const comments = ref<ApiComment[]>([]);
const loading = ref(true);
const newComment = ref('');
const submitting = ref(false);

const totalCount = computed(() =>
  comments.value.reduce((total, comment) => total + 1 + comment.replies.length, 0),
);

// Chargé côté client pour envoyer le token (et récupérer les votes de l'utilisateur)
const loadComments = async () => {
  try {
    comments.value = await api.get<ApiComment[]>(API_ROUTES.COMMENTS.BY_TIP(props.tipId));
  } catch {
    comments.value = [];
  } finally {
    loading.value = false;
  }
};

const postComment = async (content: string, parentId?: number) => {
  await api.post(API_ROUTES.COMMENTS.BY_TIP(props.tipId), { content, parentId });
  await loadComments();
};

const handlePostComment = async () => {
  if (newComment.value.trim().length < 2) return;

  submitting.value = true;
  try {
    await postComment(newComment.value.trim());
    newComment.value = '';
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    submitting.value = false;
  }
};

onMounted(loadComments);
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100">
        {{ title }}
        <span class="text-gray-400 text-sm font-normal">({{ totalCount }})</span>
      </h2>
    </div>

    <hr class="border-purple-200 dark:border-purple-700" />

    <!-- Zone d'ajout de commentaire principal -->
    <div v-if="isAuthenticated" class="flex gap-3 mb-8">
      <ProfilPicture
        :src="currentUser?.avatarProfile || undefined"
        :online="false"
        class="w-8 h-8 shrink-0"
      />
      <div class="flex-1">
        <textarea
          v-model="newComment"
          :maxlength="MAX_COMMENT_LENGTH"
          class="w-full p-3 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all"
          rows="3"
          placeholder="Ajouter un commentaire constructif..."
        />
        <div class="flex justify-end mt-2">
          <button
            :disabled="submitting || newComment.trim().length < 2"
            class="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-emerald-600 transition disabled:opacity-50"
            @click="handlePostComment"
          >
            {{ submitting ? 'Envoi...' : 'Publier' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Liste des commentaires -->
    <div v-if="loading" class="text-sm text-gray-400">Chargement des commentaires…</div>
    <div v-else-if="comments.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
      Aucun commentaire pour le moment. Soyez le premier à réagir !
    </div>
    <div v-else class="space-y-6">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :current-user-id="currentUser?.id"
        :on-reply="postComment"
        @changed="loadComments"
      />
    </div>
  </section>
</template>
