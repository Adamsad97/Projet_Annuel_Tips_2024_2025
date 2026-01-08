<script setup lang="ts">
import { ref } from 'vue';
import CommentItem from '~/components/CommentItem.vue';

const route = useRoute();
const tipId = route.params.id;

const { data: comments, refresh } = await useFetch(`/api/tips/${tipId}/comments`);

const newComment = ref('');
const submitting = ref(false);

const handlePostComment = async () => {
  if (!newComment.value.trim()) return;

  submitting.value = true;
  try {
    await $fetch(`/api/tips/${tipId}/comments`, {
      method: 'POST',
      body: { content: newComment.value },
    });
    newComment.value = '';
    await refresh(); // Reload comments
  } catch (e) {
    console.error('Failed to post comment', e);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100">
        Discussion
        <span class="text-gray-400 text-sm font-normal">({{ comments?.length || 0 }})</span>
      </h2>
    </div>

    <hr class="border-purple-200 dark:border-purple-700" />

    <!-- Zone d'ajout de commentaire principal -->
    <div class="flex gap-3 mb-8">
      <div class="w-8 h-8 rounded-full bg-emerald-500 shrink-0" />
      <!-- Placeholder avatar user -->
      <div class="flex-1">
        <textarea
          v-model="newComment"
          class="w-full p-3 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all"
          rows="3"
          placeholder="Ajouter un commentaire constructif..."
        />
        <div class="flex justify-end mt-2">
          <button
            :disabled="submitting"
            class="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-emerald-600 transition disabled:opacity-50"
            @click="handlePostComment"
          >
            {{ submitting ? 'Envoi...' : 'Publier' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Liste des commentaires -->
    <div class="space-y-6">
      <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment" />
    </div>
  </section>
</template>
