<script setup lang="ts">
import { ref } from 'vue';
import type { AppNotification } from '~/types';

const { items, unreadCount, markRead, markAllRead } = useNotifications();

const isOpen = ref(false);
const root = ref<HTMLElement | null>(null);

const ICONS: Record<AppNotification['type'], string> = {
  NEW_MESSAGE: 'tabler:message',
  BADGE_UNLOCKED: 'tabler:award',
};

const formatDate = (date: string) =>
  new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const openNotification = async (notification: AppNotification) => {
  isOpen.value = false;
  await markRead(notification);
  if (notification.link) {
    await navigateTo(notification.link);
  }
};

const onClickOutside = (event: MouseEvent) => {
  if (root.value && !root.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', onClickOutside));
onUnmounted(() => document.removeEventListener('click', onClickOutside));
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 bg-white/80 text-gray-700 shadow-sm hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 transition"
      :aria-label="`Notifications (${unreadCount} non lues)`"
      @click="isOpen = !isOpen"
    >
      <Icon name="tabler:bell" class="w-5 h-5" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden"
    >
      <div
        class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800"
      >
        <span class="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="text-xs font-bold text-purple-600 hover:underline"
          @click="markAllRead"
        >
          Tout marquer comme lu
        </button>
      </div>

      <p v-if="items.length === 0" class="px-4 py-8 text-center text-sm text-slate-500">
        Aucune notification pour le moment.
      </p>

      <ul v-else class="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        <li v-for="notification in items" :key="notification.id">
          <button
            type="button"
            class="w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            :class="{ 'bg-purple-50/60 dark:bg-purple-900/20': !notification.readAt }"
            @click="openNotification(notification)"
          >
            <Icon
              :name="ICONS[notification.type]"
              class="w-5 h-5 shrink-0 text-purple-500 mt-0.5"
            />
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                {{ notification.title }}
              </span>
              <span
                v-if="notification.body"
                class="block text-xs text-slate-500 dark:text-slate-400 truncate"
              >
                {{ notification.body }}
              </span>
              <span class="block text-[11px] text-slate-400 mt-0.5">
                {{ formatDate(notification.createdAt) }}
              </span>
            </span>
            <span
              v-if="!notification.readAt"
              class="w-2 h-2 rounded-full bg-pink-500 shrink-0 mt-2"
            />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
