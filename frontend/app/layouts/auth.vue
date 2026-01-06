<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <main class="flex-1">
      <slot />
    </main>

    <footer class="py-6 text-center text-sm text-gray-600 border-t border-gray-200 bg-white">
      <p>Tips © {{ new Date().getFullYear() }} - Partagez vos connaissances</p>
    </footer>
  </div>
</template>
