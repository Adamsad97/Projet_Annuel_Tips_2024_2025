<template>
  <div class="min-h-screen py-20 px-4 max-w-4xl mx-auto text-center space-y-16">


    <!-- Hero Section -->
    <div class="space-y-6 animate-fade-in-up">
      <div
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-sm font-bold uppercase tracking-wider mb-4">
        <Icon name="tabler:rocket" /> La Mission
      </div>
      <h1 class="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight">
        L'Entraide. Partout. <br>
        <span class="text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-500">Pour Tous.</span>
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
        AideFlash est la plateforme numéro 1 pour trouver des astuces concrètes et résoudre vos problèmes du quotidien
        en quelques minutes.
        Que ce soit pour le bricolage, l'informatique ou la cuisine, la communauté est là pour vous.
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        class="p-8 rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border border-white/20 dark:border-slate-700 shadow-xl">
        <div class="text-4xl font-black text-purple-600 dark:text-purple-400 mb-2">500+</div>
        <div class="text-gray-500 font-medium">Tips Partagés</div>
      </div>
      <div
        class="p-8 rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border border-white/20 dark:border-slate-700 shadow-xl">
        <div class="text-4xl font-black text-pink-500 dark:text-pink-400 mb-2">1.2k</div>
        <div class="text-gray-500 font-medium">Membres Actifs</div>
      </div>
      <div
        class="p-8 rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg border border-white/20 dark:border-slate-700 shadow-xl">
        <div class="text-4xl font-black text-emerald-500 dark:text-emerald-400 mb-2">100%</div>
        <div class="text-gray-500 font-medium">Open Source</div>
      </div>
    </div>

    <!-- Team / CTA -->
    <div
      class="bg-linear-to-br from-slate-900 to-purple-900 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden group">
      <div class="absolute inset-0 opacity-10" />
      <div class="relative z-10">
        <h2 class="text-3xl font-bold mb-4">Envie de rejoindre l'aventure ?</h2>
        <p class="text-purple-200 mb-8 max-w-lg mx-auto">
          Que tu sois junior ou senior, ton expérience a de la valeur. Partage ton premier tips aujourd'hui.
        </p>
        <NuxtLink to="/auth/register"
          class="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform">
          Rejoindre la communauté
          <Icon name="tabler:arrow-right" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
