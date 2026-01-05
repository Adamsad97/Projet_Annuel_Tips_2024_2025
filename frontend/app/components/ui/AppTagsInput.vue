<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: string[]
  id: string
  label: string
  placeholder?: string
  error?: string
  maxTags?: number
}>()

const emit = defineEmits(['update:modelValue'])

const inputValue = ref('')

const addTag = () => {
  const val = inputValue.value.trim()
  if (!val) return

  if (props.modelValue.includes(val)) {
    inputValue.value = ''
    return
  }

  if (props.maxTags && props.modelValue.length >= props.maxTags) return

  const newTags = [...props.modelValue, val]
  emit('update:modelValue', newTags)
  inputValue.value = ''
}

const removeTag = (index: number) => {
  const newTags = [...props.modelValue]
  newTags.splice(index, 1)
  emit('update:modelValue', newTags)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  }
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-bold text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>

    <div
      class="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all flex flex-wrap gap-2 focus-within:border-purple-500 dark:focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-500/10"
      :class="error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'">
      <div
v-for="(tag, index) in modelValue" :key="tag"
        class="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
        <span>#{{ tag }}</span>
        <button type="button" class="hover:text-purple-900 dark:hover:text-purple-100" @click="removeTag(index)">
          <Icon name="tabler:x" class="w-3 h-3" />
        </button>
      </div>

      <input
:id="id" v-model="inputValue" type="text"
        :placeholder="modelValue.length === 0 ? (placeholder || 'Ajouter des tags...') : ''"
        class="bg-transparent outline-none flex-1 min-w-[120px] placeholder:text-slate-400" @keydown="handleKeydown"
        @blur="addTag" >
    </div>
    <p class="text-xs text-slate-400">Appuyez sur Entrée ou Virgule pour ajouter un tag</p>
    <p v-if="error" class="text-xs font-bold text-red-500">{{ error }}</p>
  </div>
</template>
