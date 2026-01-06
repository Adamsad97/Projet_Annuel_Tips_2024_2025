<script setup lang="ts">
const showSearch = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

watch(showSearch, (open) => {
  if (open && inputRef.value) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});
</script>

<template>
  <div
    class="min-h-screen w-full bg-linear-to-br from-purple-100 via-violet-200 to-white dark:from-slate-900 dark:via-green-950 dark:to-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300"
  >
    <header
      class="fixed inset-x-0 top-0 z-40 border-b border-purple-100/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300"
    >
      <AppHeader @show-search="showSearch = true" />

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-2 opacity-0"
      >
        <div
          v-if="showSearch"
          class="absolute left-0 right-0 w-full bg-white dark:bg-slate-800 border-b border-purple-100 dark:border-slate-700 shadow-lg py-3 px-4 md:hidden z-50"
        >
          <div class="max-w-lg mx-auto relative">
            <SearchInput
              ref="inputRef"
              placeholder="Rechercher un tips..."
              @blur="showSearch = false"
            />
            <button
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              @click="showSearch = false"
            >
              <Icon name="tabler:x" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </Transition>
    </header>

    <div class="pt-20 flex min-h-screen">
      <aside class="hidden md:block w-64 shrink-0">
        <div
          class="fixed left-0 top-20 w-64 overflow-y-auto border-r border-purple-50/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-slate-700"
          style="height: calc(100vh - 80px)"
        >
          <AppSidebar />
        </div>
      </aside>

      <main class="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <div class="flex-1 px-4 py-6 md:px-8 md:py-8 w-full max-w-7xl mx-auto">
          <slot />
        </div>
        <AppFooter class="mt-auto border-t border-purple-50 dark:border-slate-800" />
      </main>
    </div>

    <div
      v-if="showSearch"
      class="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 md:hidden"
      @click="showSearch = false"
    />
  </div>
</template>
