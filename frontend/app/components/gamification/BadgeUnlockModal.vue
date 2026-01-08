<script setup lang="ts">
interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

interface Props {
  badge: Badge | null;
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const showModal = computed(() => props.show && props.badge !== null);

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showModal.value) {
    emit('close');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      setTimeout(() => {
        emit('close');
      }, 5000);
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click="emit('close')"
      >
        <!-- Modal Container -->
        <Transition name="modal-bounce">
          <div
            v-if="showModal"
            class="relative max-w-md w-full"
            @click.stop
          >
            <!-- Confetti Background Effect -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="confetti confetti-1"></div>
              <div class="confetti confetti-2"></div>
              <div class="confetti confetti-3"></div>
              <div class="confetti confetti-4"></div>
              <div class="confetti confetti-5"></div>
              <div class="confetti confetti-6"></div>
            </div>

            <!-- Card -->
            <div
              class="relative bg-linear-to-br from-yellow-50 via-orange-50 to-yellow-100 dark:from-yellow-900/30 dark:via-orange-900/30 dark:to-yellow-900/30 rounded-3xl shadow-2xl border-4 border-yellow-400 dark:border-yellow-600 overflow-hidden"
            >
              <!-- Glow Effect -->
              <div class="absolute inset-0 bg-linear-to-br from-yellow-400/20 to-orange-400/20 animate-pulse pointer-events-none"></div>

              <!-- Close Button -->
              <button
                type="button"
                @click="emit('close')"
                class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                aria-label="Fermer"
              >
                <Icon name="tabler:x" class="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>

              <!-- Content -->
              <div class="relative p-8 text-center space-y-6">
                <!-- Header -->
                <div class="space-y-2">
                  <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/30 dark:bg-yellow-600/30 border border-yellow-500 dark:border-yellow-700">
                    <Icon name="tabler:sparkles" class="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                    <span class="text-sm font-bold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide">
                      Nouveau Badge Débloqué !
                    </span>
                  </div>
                </div>

                <!-- Badge Icon with Animation -->
                <div class="relative inline-block">
                  <div class="absolute inset-0 bg-yellow-400/30 dark:bg-yellow-600/30 rounded-full blur-2xl animate-ping"></div>
                  <div
                    class="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full bg-linear-to-br from-yellow-100 to-orange-100 dark:from-yellow-800/40 dark:to-orange-800/40 border-4 border-yellow-400 dark:border-yellow-600 shadow-2xl animate-badge-bounce"
                  >
                    <span class="text-6xl">{{ badge?.icon }}</span>
                  </div>
                  <div class="absolute -top-2 -right-2">
                    <Icon name="tabler:check-circle" class="w-10 h-10 text-green-500 animate-scale-in" />
                  </div>
                </div>

                <!-- Badge Info -->
                <div class="space-y-3">
                  <h2 class="text-3xl font-black text-slate-900 dark:text-white">
                    {{ badge?.name }}
                  </h2>
                  <p class="text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                    {{ badge?.description }}
                  </p>
                </div>

                <!-- XP Reward -->
                <div class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-500/20 dark:bg-purple-600/20 border-2 border-purple-400 dark:border-purple-600">
                  <Icon name="tabler:trophy" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <span class="text-xl font-bold text-purple-700 dark:text-purple-300">
                    +{{ badge?.xpReward }} XP
                  </span>
                </div>

                <!-- CTA -->
                <button
                  type="button"
                  @click="emit('close')"
                  class="w-full px-6 py-3 rounded-2xl bg-linear-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Génial ! 🎉
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-bounce-enter-active {
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.modal-bounce-leave-active {
  animation: bounceOut 0.3s ease-in;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3) translateY(-100px);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes bounceOut {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

@keyframes badgeBounce {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(-5deg);
  }
  75% {
    transform: translateY(-5px) rotate(5deg);
  }
}

.animate-badge-bounce {
  animation: badgeBounce 2s ease-in-out infinite;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s forwards;
  opacity: 0;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  opacity: 0;
  animation: confettiFall 3s ease-out infinite;
}

.confetti-1 {
  background: #fbbf24;
  left: 10%;
  animation-delay: 0s;
}

.confetti-2 {
  background: #f59e0b;
  left: 30%;
  animation-delay: 0.2s;
}

.confetti-3 {
  background: #a855f7;
  left: 50%;
  animation-delay: 0.4s;
}

.confetti-4 {
  background: #10b981;
  left: 70%;
  animation-delay: 0.6s;
}

.confetti-5 {
  background: #ec4899;
  left: 85%;
  animation-delay: 0.8s;
}

.confetti-6 {
  background: #3b82f6;
  left: 20%;
  animation-delay: 1s;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-100px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(600px) rotate(720deg);
    opacity: 0;
  }
}
</style>
