<template>
  <div class="grade-indicator" :class="`grade-${gradeName.toLowerCase()}`">
    <div v-if="showIcon" class="grade-icon">
      {{ getGradeIcon(gradeName) }}
    </div>
    <div class="grade-content">
      <span class="grade-name">{{ gradeName }}</span>
      <span v-if="showXp && xp !== undefined" class="grade-xp">{{ xp }} XP</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  gradeName: string;
  xp?: number;
  showIcon?: boolean;
  showXp?: boolean;
}

withDefaults(defineProps<Props>(), {
  showIcon: true,
  showXp: false,
});

const getGradeIcon = (grade: string) => {
  const icons: Record<string, string> = {
    débutant: '🌱',
    apprenti: '📚',
    confirmé: '⚡',
    expert: '🎯',
    maître: '👑',
    légende: '🏆',
  };
  return icons[grade.toLowerCase()] || '🌟';
};
</script>

<style scoped>
.grade-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.grade-icon {
  font-size: 1.25rem;
}

.grade-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.grade-xp {
  font-size: 0.75rem;
  opacity: 0.8;
}

.grade-débutant {
  background: #f0fdf4;
  color: #15803d;
  border: 2px solid #86efac;
}

.grade-apprenti {
  background: #dbeafe;
  color: #1e40af;
  border: 2px solid #93c5fd;
}

.grade-confirmé {
  background: #fef3c7;
  color: #92400e;
  border: 2px solid #fcd34d;
}

.grade-expert {
  background: #fce7f3;
  color: #9f1239;
  border: 2px solid #f9a8d4;
}

.grade-maître {
  background: #f3e8ff;
  color: #6b21a8;
  border: 2px solid #d8b4fe;
}

.grade-légende {
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fecaca 100%);
  color: #7c2d12;
  border: 2px solid #fdba74;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
}
</style>
