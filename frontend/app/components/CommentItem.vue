<script setup lang="ts">
import { ref } from 'vue';
import ProfilPicture from '~/components/ProfilPicture.vue';
import TextTruncate from '~/components/TextTruncate.vue';

defineProps({
  comment: { type: Object, required: true },
  depth: { type: Number, default: 0 }, // Pour décaler visuellement les réponses
});

const isCollapsed = ref(false);
const isReplying = ref(false);
const replyContent = ref('');

const toggleCollapse = () => (isCollapsed.value = !isCollapsed.value);
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
        <ProfilPicture :src="comment.author.avatar" class="w-8 h-8" />
      </div>

      <!-- Contenu -->
      <div class="flex-1">
        <!-- Header Auteur -->
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{
            comment.author.name
          }}</span>
          <span class="text-xs text-gray-400">{{ comment.publishedAgo }}</span>

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
          <TextTruncate :text="comment.body" :max-length="200" class="mb-2" />

          <!-- Actions (Répondre, Vote...) -->
          <div
            class="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3"
          >
            <button
              class="hover:text-emerald-500 flex items-center gap-1"
              @click="isReplying = !isReplying"
            >
              <Icon name="tabler:message-circle-2" class="w-4 h-4" /> Répondre
            </button>
            <button class="hover:text-purple-500 flex items-center gap-1">
              <Icon name="tabler:thumb-up" class="w-4 h-4" /> {{ comment.likes }}
            </button>
          </div>

          <!-- Zone de réponse -->
          <div v-if="isReplying" class="mb-4 animate-fade-in-down">
            <textarea
              v-model="replyContent"
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
                class="text-xs bg-emerald-500 text-white px-3 py-1 rounded-md hover:bg-emerald-600"
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
          Commentaire masqué ({{ comment.replies?.length || 0 }} réponses)
        </div>

        <!-- RÉCURSIVITÉ : Réponses (Enfants) -->
        <!-- On ne les affiche que si NON plié -->
        <div
          v-if="comment.replies && comment.replies.length > 0 && !isCollapsed"
          class="mt-4 pl-4 border-l-2 border-gray-100 dark:border-slate-800 space-y-4"
        >
          <CommentItem
            v-for="reply in comment.replies"
            :key="reply.id"
            :comment="reply"
            :depth="depth + 1"
          />
        </div>
      </div>
    </div>
  </div>
</template>
