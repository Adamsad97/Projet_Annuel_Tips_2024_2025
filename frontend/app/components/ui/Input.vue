<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    hint?: string;
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
  },
);

defineEmits<{
  blur: [];
  focus: [];
}>();

const modelValue = defineModel<string>({ default: '' });

const inputClasses = computed(() => {
  const baseClasses =
    'block w-full rounded-lg border px-4 py-2 text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  if (props.error) {
    return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-500`;
  }

  return `${baseClasses} border-gray-300 focus:border-primary-500 focus:ring-primary-500`;
});
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <input
      :id="id"
      v-model="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="inputClasses"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    />

    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>

    <p v-else-if="hint" class="mt-1 text-sm text-gray-500">
      {{ hint }}
    </p>
  </div>
</template>
