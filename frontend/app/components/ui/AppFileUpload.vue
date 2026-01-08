<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  modelValue: File[];
  id: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  error?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', files: File[]): void;
}>();

const dragActive = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const previews = computed(() => {
  return props.modelValue.map((file) => {
    if (file.type.startsWith('image/')) {
      return { file, url: URL.createObjectURL(file), isImage: true };
    }
    return { file, url: null, isImage: false };
  });
});

const handleFiles = (files: FileList | null) => {
  if (!files) return;

  const newFiles: File[] = [];
  Array.from(files).forEach((file) => {
    if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
      alert(`Le fichier ${file.name} est trop volumineux (Max ${props.maxSize}MB)`);
      return;
    }
    newFiles.push(file);
  });

  const updatedFiles = props.multiple ? [...props.modelValue, ...newFiles] : newFiles;
  emit('update:modelValue', updatedFiles);
};

const onDrop = (e: DragEvent) => {
  dragActive.value = false;
  handleFiles(e.dataTransfer?.files || null);
};

const onChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  handleFiles(target.files);
  if (target) target.value = '';
};

const removeFile = (index: number) => {
  const newFiles = [...props.modelValue];
  newFiles.splice(index, 1);
  emit('update:modelValue', newFiles);
};

const triggerInput = () => {
  inputRef.value?.click();
};
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-bold text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>

    <div
      class="border-2 border-dashed rounded-xl p-6 transition-colors flex flex-col items-center justify-center gap-4 text-center cursor-pointer"
      :class="[
        dragActive
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800/50',
        error ? 'border-red-400' : '',
      ]"
      @dragenter.prevent="dragActive = true"
      @dragleave.prevent="dragActive = false"
      @dragover.prevent
      @drop.prevent="onDrop"
      @click="triggerInput"
    >
      <input
        :id="id"
        ref="inputRef"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="hidden"
        @change="onChange"
      />

      <div
        class="p-3 bg-purple-100 dark:bg-slate-800 rounded-full text-purple-600 dark:text-purple-400"
      >
        <Icon name="tabler:cloud-upload" class="w-6 h-6" />
      </div>
      <div>
        <p class="font-bold text-slate-700 dark:text-slate-200">
          Cliquez ou déposez des fichiers ici
        </p>
        <p class="text-xs text-slate-500 mt-1">
          {{ accept ? accept.split(',').join(', ') : 'Tous fichiers' }}
          <span v-if="maxSize">(Max {{ maxSize }}MB)</span>
        </p>
      </div>
    </div>

    <!-- Previews list -->
    <div v-if="modelValue.length > 0" class="flex flex-col gap-2 mt-2">
      <div
        v-for="(item, index) in previews"
        :key="index"
        class="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
      >
        <!-- Thumbnail for images, Icon for others -->
        <div
          class="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0"
        >
          <img v-if="item.isImage && item.url" :src="item.url" class="w-full h-full object-cover" />
          <Icon v-else name="tabler:file-text" class="w-6 h-6 text-slate-400" />
        </div>

        <div class="flex-1 min-w-0 flex flex-col items-start truncate">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate w-full">{{
            item.file.name
          }}</span>
          <span class="text-xs text-slate-400">{{ (item.file.size / 1024).toFixed(1) }} KB</span>
        </div>

        <button
          type="button"
          class="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
          @click="removeFile(index)"
        >
          <Icon name="tabler:trash" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <p v-if="error" class="text-xs font-bold text-red-500">{{ error }}</p>
  </div>
</template>
