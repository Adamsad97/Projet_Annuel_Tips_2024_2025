<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  text: { type: String, required: true },
  maxLength: { type: Number, default: 150 },
});

const expanded = ref(false);

const shouldTruncate = computed(() => props.text.length > props.maxLength);
const displayedText = computed(() => {
  if (expanded.value || !shouldTruncate.value) return props.text;
  return props.text.substring(0, props.maxLength) + '...';
});
</script>

<template>
  <div>
    <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
      {{ displayedText }}
    </p>
    <button
      v-if="shouldTruncate"
      class="text-xs font-medium text-emerald-500 hover:underline mt-1"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Voir moins' : 'Voir plus' }}
    </button>
  </div>
</template>
