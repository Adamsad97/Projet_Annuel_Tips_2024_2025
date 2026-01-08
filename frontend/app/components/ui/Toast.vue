<script setup lang="ts">
interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

function toastClasses(type: Toast['type']) {
  const classes = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return classes[type];
}

function addToast(toast: Omit<Toast, 'id'>) {
  const id = nextId++;
  toasts.value.push({ id, ...toast });

  setTimeout(() => removeToast(id), 5000);
}

function removeToast(id: number) {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
}

defineExpose({ addToast });
</script>

<template>
  <!-- teleport sort du dom parent vers body pour z-index correct -->
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="toastClasses(toast.type)"
          class="rounded-lg shadow-lg p-4 border flex items-start"
        >
          <div class="flex-1">
            <p v-if="toast.title" class="font-medium">{{ toast.title }}</p>
            <p :class="toast.title ? 'text-sm mt-1' : ''">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="ml-3 flex-shrink-0 hover:opacity-75"
            @click="removeToast(toast.id)"
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(2rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(2rem);
}
</style>
