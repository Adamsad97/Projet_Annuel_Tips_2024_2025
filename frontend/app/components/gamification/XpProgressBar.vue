<template>
  <div class="xp-progress-bar">
    <div class="xp-header">
      <div class="xp-info">
        <span class="current-grade">
          <Icon name="tabler:award" class="grade-icon" />
          {{ currentGrade }}
        </span>
        <span v-if="nextGrade" class="next-grade">→ {{ nextGrade }}</span>
      </div>
      <div class="xp-numbers">
        <span class="current-xp">{{ currentXp }} XP</span>
        <span v-if="nextGrade" class="xp-needed">/ {{ xpToNext }} XP</span>
      </div>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progressPercent}%` }">
        <div class="progress-shine"></div>
      </div>
      <div class="progress-particles">
        <span v-for="i in 5" :key="i" class="particle" :style="{ left: `${i * 20}%` }"></span>
      </div>
    </div>

    <div v-if="nextGrade" class="progress-text">
      <Icon name="tabler:trophy" class="trophy-icon" />
      {{ xpRemaining }} XP jusqu'au prochain grade
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentXp: number;
  currentGrade: string;
  nextGrade?: string | null;
  xpToNext?: number;
  progressPercent?: number;
}

const props = withDefaults(defineProps<Props>(), {
  nextGrade: null,
  xpToNext: 0,
  progressPercent: 0,
});

const xpRemaining = computed(() => {
  return props.xpToNext - props.currentXp;
});
</script>

<style scoped>
.xp-progress-bar {
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.xp-progress-bar:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.xp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.xp-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.current-grade {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #7c3aed;
  font-size: 1.125rem;
  animation: pulse-grade 2s ease-in-out infinite;
}

.grade-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #a855f7;
}

@keyframes pulse-grade {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.next-grade {
  color: #64748b;
  font-size: 0.875rem;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.xp-progress-bar:hover .next-grade {
  opacity: 1;
}

.xp-numbers {
  font-size: 0.875rem;
  color: #475569;
}

.current-xp {
  font-weight: 700;
  color: #7c3aed;
  background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.progress-bar {
  position: relative;
  height: 14px;
  background: linear-gradient(90deg, #e9d5ff 0%, #f3e8ff 100%);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  position: relative;
  height: 100%;
  background: linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%);
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

.progress-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  top: 50%;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: float-particle 3s infinite ease-in-out;
}

.particle:nth-child(1) {
  animation-delay: 0s;
}
.particle:nth-child(2) {
  animation-delay: 0.6s;
}
.particle:nth-child(3) {
  animation-delay: 1.2s;
}
.particle:nth-child(4) {
  animation-delay: 1.8s;
}
.particle:nth-child(5) {
  animation-delay: 2.4s;
}

@keyframes float-particle {
  0%,
  100% {
    transform: translateY(-50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translateY(-150%) scale(1);
    opacity: 1;
  }
}

.progress-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  text-align: center;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.trophy-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: #a855f7;
  animation: bounce-trophy 2s infinite;
}

@keyframes bounce-trophy {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@media (prefers-color-scheme: dark) {
  .xp-progress-bar {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  }

  .progress-bar {
    background: linear-gradient(90deg, #312e81 0%, #4c1d95 100%);
  }

  .current-xp {
    color: #c084fc;
  }

  .progress-text {
    color: #94a3b8;
  }
}
</style>
