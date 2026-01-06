<script setup lang="ts">
defineProps<{
  modelValue: string;
  id: string;
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  rows?: number;
}>();

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-bold text-slate-700 dark:text-slate-300">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :rows="rows || 4"
      :placeholder="placeholder"
      class="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 resize-y"
      :class="[
        error
          ? 'border-red-400 focus:border-red-500 ring-4 ring-red-500/10'
          : 'border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="text-xs font-bold text-red-500">{{ error }}</p>
  </div>
</template>
