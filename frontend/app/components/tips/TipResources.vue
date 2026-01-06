<script setup lang="ts">
defineProps<{
  documents?: { name: string; url: string }[];
}>();
</script>

<template>
  <div
    v-if="documents && documents.length > 0"
    class="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl p-6 shadow-lg border border-white/40 dark:border-white/5 ring-1 ring-white/20 flex flex-col"
  >
    <h3
      class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2"
    >
      <Icon name="tabler:paperclip" /> Ressources
    </h3>
    <div class="flex-1 space-y-3">
      <a
        v-for="(doc, idx) in documents"
        :key="idx"
        :href="doc.url"
        target="_blank"
        class="flex items-center gap-4 p-3 rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-purple-500/10 border border-white/40 dark:border-white/5 transition-all group"
      >
        <div
          class="w-10 h-10 rounded-xl bg-white/60 dark:bg-white/10 flex items-center justify-center text-blue-500 shadow-sm backdrop-blur-sm"
        >
          <Icon name="tabler:file" class="w-5 h-5" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-sm text-slate-800 dark:text-white truncate">
            {{ doc.name }}
          </div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">PDF • 2.4 MB</div>
        </div>
        <div
          class="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icon name="tabler:download" class="w-4 h-4 text-slate-700 dark:text-white" />
        </div>
      </a>
    </div>
  </div>
</template>
