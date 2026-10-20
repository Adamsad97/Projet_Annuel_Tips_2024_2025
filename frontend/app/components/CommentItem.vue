<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ApiComment } from '~/types';
import ProfilPicture from '~/components/ProfilPicture.vue';
import TextTruncate from '~/components/TextTruncate.vue';
import VoteButtons from '~/components/interactions/VoteButtons.vue';
import ReportButton from '~/components/interactions/ReportButton.vue';
import { API_ROUTES } from '~/config/api';

const props = withDefaults(
  defineProps<{
    comment: ApiComment;
    currentUserId?: number;
    depth?: number;
    // Publie une réponse (fourni par CommentsSection, qui recharge ensuite la liste)
    onReply: (content: string, parentId: number) => Promise<void>;
  }>(),
  { currentUserId: undefined, depth: 0 },
);

const emit = defineEmits<{
  (e: 'changed'): void;
}>();

const api = useApi();
const { isAuthenticated } = useAuth();

const isCollapsed = ref(false);
const isReplying = ref(false);
const replyContent = ref('');
const isEditing = ref(false);
const editContent = ref('');
const busy = ref(false);

const isOwner = computed(() => props.currentUserId === props.comment.user.id);
const authorName = computed(
  () =>
    [props.comment.user.firstname, props.comment.user.lastname].filter(Boolean).join(' ') ||
    props.comment.user.username,
);
const publishedAgo = computed(() => new Date(props.comment.createdAt).toLocaleDateString('fr-FR'));
const wasEdited = computed(() => props.comment.updatedAt !== props.comment.createdAt);

const toggleCollapse = () => (isCollapsed.value = !isCollapsed.value);

const sendReply = async () => {
  if (replyContent.value.trim().length < 2) return;

  busy.value = true;
  try {
    await props.onReply(replyContent.value.trim(), props.comment.id);
    replyContent.value = '';
    isReplying.value = false;
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    busy.value = false;
  }
};

const startEdit = () => {
  editContent.value = props.comment.content;
  isEditing.value = true;
};

const saveEdit = async () => {
  if (editContent.value.trim().length < 2) return;

  busy.value = true;
  try {
    await api.patch(API_ROUTES.COMMENTS.DETAIL(props.comment.id), {
      content: editContent.value.trim(),
    });
    isEditing.value = false;
    emit('changed');
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    busy.value = false;
  }
};

const deleteComment = async () => {
  if (!confirm('Supprimer ce commentaire ? Ses réponses seront aussi supprimées.')) return;

  busy.value = true;
  try {
    await api.delete(API_ROUTES.COMMENTS.DETAIL(props.comment.id));
    emit('changed');
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <div class="relative group">
    <!-- Ligne verticale de fil (Thread line) -->
    <div
      v-if="depth > 0"
      class="absolute -left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-slate-700 group-last:bottom-auto group-last:h-6"
    />

    <div class="flex gap-3" :class="{ 'opacity-60': isCollapsed }">
      <!-- Avatar -->
      <div class="shrink-0 cursor-pointer" @click="toggleCollapse">
        <ProfilPicture
          :src="comment.user.avatarProfile || undefined"
          :alt="authorName"
          :online="false"
          class="w-8 h-8"
        />
      </div>

      <!-- Contenu -->
      <div class="flex-1">
        <!-- Header Auteur -->
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ authorName }}</span>
          <span class="text-xs text-gray-400">
            {{ publishedAgo }}<template v-if="wasEdited"> · modifié</template>
          </span>

          <!-- Bouton Collapse (visible au hover ou si plié) -->
          <button
            class="text-gray-400 hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity px-1"
            title="Réduire/Déplier"
            @click="toggleCollapse"
          >
            <Icon :name="isCollapsed ? 'tabler:arrows-maximize' : 'tabler:minus'" class="w-3 h-3" />
          </button>
        </div>

        <!-- Corps du commentaire (Masqué si collapsed) -->
        <div v-if="!isCollapsed">
          <div v-if="isEditing" class="mb-3">
            <textarea
              v-model="editContent"
              maxlength="2000"
              class="w-full p-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
              rows="3"
            />
            <div class="flex justify-end gap-2 mt-2">
              <button
                class="text-xs text-gray-500 hover:text-gray-700 px-3 py-1"
                @click="isEditing = false"
              >
                Annuler
              </button>
              <button
                :disabled="busy"
                class="text-xs bg-purple-500 text-white px-3 py-1 rounded-md hover:bg-purple-600 disabled:opacity-50"
                @click="saveEdit"
              >
                Enregistrer
              </button>
            </div>
          </div>
          <TextTruncate v-else :text="comment.content" :max-length="200" class="mb-2" />

          <!-- Actions (Vote, Répondre, Signaler…) -->
          <div
            class="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3"
          >
            <VoteButtons
              :endpoint="API_ROUTES.VOTES.COMMENT(comment.id)"
              :score="comment.score"
              :user-vote="comment.userVote"
              :disabled="isOwner"
              size="sm"
            />
            <button
              v-if="isAuthenticated"
              class="hover:text-emerald-500 flex items-center gap-1"
              @click="isReplying = !isReplying"
            >
              <Icon name="tabler:message-circle-2" class="w-4 h-4" /> Répondre
            </button>
            <template v-if="isOwner">
              <button class="hover:text-purple-500 flex items-center gap-1" @click="startEdit">
                <Icon name="tabler:pencil" class="w-4 h-4" /> Modifier
              </button>
              <button
                :disabled="busy"
                class="hover:text-red-500 flex items-center gap-1"
                @click="deleteComment"
              >
                <Icon name="tabler:trash" class="w-4 h-4" /> Supprimer
              </button>
            </template>
            <ReportButton
              v-else
              :endpoint="API_ROUTES.REPORTS.COMMENT(comment.id)"
              target="ce commentaire"
              compact
            />
          </div>

          <!-- Zone de réponse -->
          <div v-if="isReplying" class="mb-4 animate-fade-in-down">
            <textarea
              v-model="replyContent"
              maxlength="2000"
              class="w-full p-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              rows="2"
              placeholder="Votre réponse..."
            />
            <div class="flex justify-end gap-2 mt-2">
              <button
                class="text-xs text-gray-500 hover:text-gray-700 px-3 py-1"
                @click="isReplying = false"
              >
                Annuler
              </button>
              <button
                :disabled="busy || replyContent.trim().length < 2"
                class="text-xs bg-emerald-500 text-white px-3 py-1 rounded-md hover:bg-emerald-600 disabled:opacity-50"
                @click="sendReply"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>

        <!-- Message si plié -->
        <div
          v-else
          class="text-xs text-gray-400 italic mb-2 cursor-pointer"
          @click="toggleCollapse"
        >
          Commentaire masqué ({{ comment.replies.length }} réponses)
        </div>

        <!-- Réponses (un seul niveau), affichées si NON plié -->
        <div
          v-if="comment.replies.length > 0 && !isCollapsed"
          class="mt-4 pl-4 border-l-2 border-gray-100 dark:border-slate-800 space-y-4"
        >
          <CommentItem
            v-for="reply in comment.replies"
            :key="reply.id"
            :comment="reply"
            :current-user-id="currentUserId"
            :depth="depth + 1"
            :on-reply="onReply"
            @changed="emit('changed')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
