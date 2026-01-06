<script setup lang="ts">
import { computed, resolveComponent } from 'vue';

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  to?: string;
  href?: string;
}>();

const NuxtLink = resolveComponent('NuxtLink');

const componentType = computed(() => {
  if (props.to) return NuxtLink;
  if (props.href) return 'a';
  return 'button';
});
</script>

<template>
  <component
    :is="componentType"
    :to="to"
    :href="href"
    :type="!to && !href ? type || 'button' : undefined"
    :disabled="disabled || loading"
    class="relative px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
    :class="{
      'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02]':
        variant === 'primary' || !variant,
      'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 hover:text-purple-600':
        variant === 'secondary',
      'border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20':
        variant === 'outline',
      'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30': variant === 'danger',
    }"
  >
    <Icon v-if="loading" name="tabler:loader-2" class="w-5 h-5 animate-spin" />
    <slot />
  </component>
</template>
