<script setup lang="ts">
interface Option {
  value: string | number;
  label: string;
}

defineProps<{
  modelValue: string | number;
  id: string;
  label: string;
  options: Option[];
  error?: string;
  required?: boolean;
  placeholder?: string;
}>();

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-bold text-slate-700 dark:text-slate-300">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <select
        :id="id"
        :value="modelValue"
        class="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none transition-all appearance-none cursor-pointer"
        :class="[
          !modelValue ? 'text-slate-400' : '',
          error
            ? 'border-red-400 focus:border-red-500 ring-4 ring-red-500/10'
            : 'border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10',
        ]"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="placeholder" value="" disabled selected>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          class="text-slate-800 dark:text-slate-100"
        >
          {{ option.label }}
        </option>
      </select>
      <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
        <Icon name="tabler:chevron-down" class="w-5 h-5" />
      </div>
    </div>
    <p v-if="error" class="text-xs font-bold text-red-500">{{ error }}</p>
  </div>
</template>
