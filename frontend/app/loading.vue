<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
    <div class="text-center">
      <svg class="animate-spin h-10 w-10 mx-auto text-primary-600" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p class="mt-2 text-sm text-gray-700"><slot>Chargement…</slot></p>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
