<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string;
    padding?: boolean;
    shadow?: boolean;
  }>(),
  {
    padding: true,
    shadow: true,
  },
);

const cardClasses = computed(() => {
  const baseClasses = 'bg-white rounded-lg border border-gray-200';
  const shadowClass = props.shadow ? 'shadow-sm' : '';

  return `${baseClasses} ${shadowClass}`;
});
</script>

<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" class="px-6 py-4 border-b border-gray-200">
      <slot name="header">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </slot>
    </div>

    <div class="px-6 py-4">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <slot name="footer" />
    </div>
  </div>
</template>
