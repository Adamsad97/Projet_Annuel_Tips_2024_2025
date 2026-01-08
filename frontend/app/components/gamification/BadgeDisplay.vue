<template>
  <div class="badge-display" :class="{ earned: badge.earned, locked: !badge.earned }">
    <div class="badge-icon-wrapper">
      <div class="badge-icon">
        {{ badge.icon }}
      </div>
      <div v-if="badge.earned" class="badge-sparkle">
        <span
          v-for="i in 4"
          :key="i"
          class="sparkle"
          :style="{ transform: `rotate(${i * 90}deg)` }"
        ></span>
      </div>
      <div v-if="badge.earned" class="badge-glow"></div>
    </div>
    <div class="badge-info">
      <h4 class="badge-name">
        {{ badge.name }}
        <Icon v-if="badge.earned" name="tabler:circle-check-filled" class="check-icon" />
      </h4>
      <p class="badge-description">{{ badge.description }}</p>

      <div v-if="!badge.earned && showProgress" class="badge-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${badge.progress}%` }">
            <div class="progress-shimmer"></div>
          </div>
        </div>
        <span class="progress-text">{{ Math.round(badge.progress) }}%</span>
      </div>

      <div v-if="badge.earned && badge.earnedAt" class="earned-date">
        <Icon name="tabler:calendar-check" class="date-icon" />
        Obtenu le {{ formatDate(badge.earnedAt) }}
      </div>

      <div class="badge-reward" :class="{ 'earned-reward': badge.earned }">
        <Icon name="tabler:star-filled" class="star-icon" />
        +{{ badge.xpReward }} XP
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Badge {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: Date;
  progress: number;
}

interface Props {
  badge: Badge;
  showProgress?: boolean;
}

withDefaults(defineProps<Props>(), {
  showProgress: true,
});

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
</script>

<style scoped>
.badge-display {
  display: flex;
  gap: 1.25rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.badge-display::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.badge-display:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #c084fc;
}

.badge-display:hover::before {
  opacity: 1;
}

.badge-display.earned {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  animation: badge-earn 0.6s ease-out;
}

@keyframes badge-earn {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.badge-display.locked {
  opacity: 0.65;
  background: linear-gradient(135deg, #f8f9fa 0%, #e2e8f0 100%);
}

.badge-display.locked:hover {
  opacity: 0.8;
}

.badge-icon-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.badge-icon {
  font-size: 3rem;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.badge-display.earned .badge-icon {
  background: linear-gradient(135deg, #dcfce7 0%, #86efac 100%);
  animation: icon-bounce 0.6s ease-out;
  filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3));
}

@keyframes icon-bounce {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2) rotate(5deg);
  }
}

.badge-display:hover .badge-icon {
  transform: scale(1.1) rotate(-5deg);
}

.badge-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 3;
}

.sparkle {
  position: absolute;
  top: -10%;
  left: 50%;
  width: 4px;
  height: 16px;
  background: linear-gradient(to bottom, #fbbf24, transparent);
  border-radius: 2px;
  transform-origin: 0 36px;
  animation: sparkle-twinkle 2s infinite ease-in-out;
}

.sparkle:nth-child(1) {
  animation-delay: 0s;
}
.sparkle:nth-child(2) {
  animation-delay: 0.5s;
}
.sparkle:nth-child(3) {
  animation-delay: 1s;
}
.sparkle:nth-child(4) {
  animation-delay: 1.5s;
}

@keyframes sparkle-twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.badge-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2s infinite ease-in-out;
  z-index: 1;
}

@keyframes glow-pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0.2;
  }
}

.badge-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.badge-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.check-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #10b981;
  animation: check-appear 0.4s ease-out;
}

@keyframes check-appear {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

.badge-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.badge-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.progress-bar {
  position: relative;
  flex: 1;
  height: 8px;
  background: linear-gradient(90deg, #e9d5ff 0%, #f3e8ff 100%);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  position: relative;
  height: 100%;
  background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

.progress-text {
  font-size: 0.75rem;
  color: #7c3aed;
  font-weight: 700;
  min-width: 45px;
  text-align: right;
}

.earned-date {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.date-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.badge-reward {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.875rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 16px;
  align-self: flex-start;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(30, 64, 175, 0.1);
}

.star-icon {
  width: 0.875rem;
  height: 0.875rem;
  animation: star-rotate 3s linear infinite;
}

@keyframes star-rotate {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
}

.badge-reward.earned-reward {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.badge-display:hover .badge-reward {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
}

@media (prefers-color-scheme: dark) {
  .badge-display {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-color: #475569;
  }

  .badge-display.earned {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
    border-color: #10b981;
  }

  .badge-icon {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
  }

  .badge-display.earned .badge-icon {
    background: linear-gradient(135deg, #047857 0%, #059669 100%);
  }

  .badge-name {
    color: #f1f5f9;
  }

  .badge-description {
    color: #94a3b8;
  }

  .progress-bar {
    background: linear-gradient(90deg, #312e81 0%, #4c1d95 100%);
  }
}
</style>
