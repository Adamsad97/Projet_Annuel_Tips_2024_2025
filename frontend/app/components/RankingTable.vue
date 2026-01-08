<script setup lang="ts">
import type { RankingUser } from '~/types';

interface Props {
  users: RankingUser[];
  categoryFilter: 'xp' | 'tips' | 'votes';
  statLabel: string;
}

defineProps<Props>();
</script>

<template>
  <div
    class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-slate-800 shadow-2xl overflow-hidden"
  >
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <tr>
            <th
              class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center"
            >
              #
            </th>
            <th class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Membre
            </th>
            <th
              class="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right"
            >
              Stats
            </th>
            <th
              class="px-6 py-5 text-sm font-bold text-purple-600 uppercase tracking-widest text-right"
            >
              Score {{ statLabel }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/30 dark:divide-slate-800/50">
          <tr
            v-for="(user, index) in users"
            :key="user.id"
            class="group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 border-b border-white/20 dark:border-slate-800/50 last:border-b-0"
          >
            <td class="px-6 py-5 text-center">
              <span
                class="w-10 h-10 bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl flex items-center justify-center font-black text-lg text-purple-600 group-hover:scale-110 transition-transform"
              >
                {{ index + 4 }}
              </span>
            </td>

            <td class="px-6 py-5">
              <div class="flex items-center gap-4">
                <img
                  :src="user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=128`"
                  class="w-12 h-12 rounded-2xl object-cover shadow-lg ring-2 ring-white/50 group-hover:scale-110 transition-all duration-300"
                  @error="(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=128`"
                />
                <div>
                  <div
                    class="font-black text-lg text-slate-800 dark:text-slate-100 group-hover:text-purple-600 transition-colors"
                  >
                    {{ user.name }}
                  </div>
                  <div
                    class="text-xs bg-linear-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 px-3 py-1 rounded-full text-slate-600 font-bold"
                  >
                    {{ user.role }}
                  </div>
                </div>
              </div>
            </td>

            <td class="px-6 py-5 text-right">
              <div class="flex items-center justify-end gap-6">
                <div
                  class="flex flex-col items-end gap-1 text-xs font-bold opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  <div
                    class="flex items-center gap-1"
                    :class="categoryFilter === 'tips' ? 'text-amber-600' : 'text-slate-500'"
                  >
                    <Icon name="tabler:bulb" class="w-4 h-4" />
                    {{ user.tips }}
                  </div>
                  <div
                    class="flex items-center gap-1"
                    :class="categoryFilter === 'votes' ? 'text-pink-500' : 'text-slate-500'"
                  >
                    <Icon name="tabler:heart" class="w-4 h-4" />
                    {{ user.votes }}
                  </div>
                </div>
              </div>
            </td>

            <td class="px-6 py-5">
              <div class="text-right">
                <span
                  class="text-2xl font-black bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-200"
                >
                  {{ user[categoryFilter] }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
