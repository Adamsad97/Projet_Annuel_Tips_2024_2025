<template>
  <div class="moderation-page">
    <h1>Modération</h1>

    <!-- Stats -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pendingTips }}</span>
          <span class="stat-label">Tips en attente</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🚨</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pendingReports }}</span>
          <span class="stat-label">Signalements</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👮</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalModerators }}</span>
          <span class="stat-label">Modérateurs actifs</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalActions }}</span>
          <span class="stat-label">Actions totales</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'tips' }" @click="activeTab = 'tips'">
        Tips en attente ({{ pendingTips.length }})
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'reports' }"
        @click="activeTab = 'reports'"
      >
        Signalements ({{ reports.length }})
      </button>
    </div>

    <!-- Tips en attente -->
    <div v-if="activeTab === 'tips'" class="content-section">
      <div v-if="loading" class="loading">Chargement...</div>

      <div v-else-if="pendingTips.length === 0" class="empty-state">
        Aucun tip en attente de modération
      </div>

      <div v-else class="tips-list">
        <div v-for="tip in pendingTips" :key="tip.id" class="tip-card">
          <div class="tip-header">
            <h3>{{ tip.title }}</h3>
            <span class="tip-date">{{ formatDate(tip.createdAt) }}</span>
          </div>
          <p class="tip-content">{{ tip.content }}</p>
          <div class="tip-meta">
            <span>Par {{ tip.user.firstname }} {{ tip.user.lastname }}</span>
            <span v-if="tip.categories.length > 0"> • {{ tip.categories[0].category.name }} </span>
          </div>
          <div class="tip-actions">
            <button class="btn btn-approve" @click="approveTip(tip.id)" :disabled="actionLoading">
              ✅ Approuver
            </button>
            <button
              class="btn btn-reject"
              @click="showRejectModal(tip.id)"
              :disabled="actionLoading"
            >
              ❌ Rejeter
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Signalements -->
    <div v-if="activeTab === 'reports'" class="content-section">
      <div v-if="loading" class="loading">Chargement...</div>

      <div v-else-if="reports.length === 0" class="empty-state">Aucun signalement en attente</div>

      <div v-else class="reports-list">
        <div v-for="report in reports" :key="report.id" class="report-card">
          <div class="report-header">
            <span class="report-type">{{ report.tipId ? '📝 Tip' : '💬 Commentaire' }}</span>
            <span class="report-date">{{ formatDate(report.createdAt) }}</span>
          </div>
          <p class="report-reason">{{ report.reason }}</p>
          <div class="report-actions">
            <button
              class="btn btn-approve"
              @click="resolveReport(report.id, 'APPROVE')"
              :disabled="actionLoading"
            >
              ✅ Approuver le contenu
            </button>
            <button
              class="btn btn-reject"
              @click="resolveReport(report.id, 'REJECT')"
              :disabled="actionLoading"
            >
              ❌ Rejeter le contenu
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectModalOpen" class="modal-overlay" @click="rejectModalOpen = false">
      <div class="modal" @click.stop>
        <h3>Rejeter le tip</h3>
        <p>Veuillez indiquer la raison du rejet :</p>
        <textarea v-model="rejectReason" placeholder="Raison du rejet..." rows="4" />
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="rejectModalOpen = false">Annuler</button>
          <button class="btn btn-reject" @click="confirmRejectTip" :disabled="!rejectReason.trim()">
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModerationStats, PendingTip, Report, ReportAction } from '~/types/moderation.types';

definePageMeta({
  middleware: ['auth', 'moderator'],
});

const api = useApi();

const activeTab = ref<'tips' | 'reports'>('tips');
const loading = ref(false);
const actionLoading = ref(false);

const stats = ref<ModerationStats | null>(null);
const pendingTips = ref<PendingTip[]>([]);
const reports = ref<Report[]>([]);

const rejectModalOpen = ref(false);
const rejectReason = ref('');
const selectedTipId = ref<number | null>(null);

const loadStats = async () => {
  try {
    const response = await api.get<ModerationStats>('/moderation/stats');
    stats.value = response;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
};

const loadPendingTips = async () => {
  loading.value = true;
  try {
    const response = await api.get<PendingTip[] | { data: PendingTip[] }>(
      '/moderation/tips/pending',
    );
    pendingTips.value = Array.isArray(response) ? response : response.data;
  } catch (err) {
    console.error('Failed to load pending tips:', err);
  } finally {
    loading.value = false;
  }
};

const loadReports = async () => {
  loading.value = true;
  try {
    const response = await api.get<Report[] | { data: Report[] }>('/moderation/reports');
    reports.value = Array.isArray(response) ? response : response.data;
  } catch (err) {
    console.error('Failed to load reports:', err);
  } finally {
    loading.value = false;
  }
};

const approveTip = async (tipId: number) => {
  actionLoading.value = true;
  try {
    await api.post(`/moderation/tips/${tipId}/approve`);
    pendingTips.value = pendingTips.value.filter((t) => t.id !== tipId);
    await loadStats();
  } catch (err) {
    console.error('Failed to approve tip:', err);
  } finally {
    actionLoading.value = false;
  }
};

const showRejectModal = (tipId: number) => {
  selectedTipId.value = tipId;
  rejectReason.value = '';
  rejectModalOpen.value = true;
};

const confirmRejectTip = async () => {
  if (!selectedTipId.value || !rejectReason.value.trim()) return;

  actionLoading.value = true;
  try {
    await api.post(`/moderation/tips/${selectedTipId.value}/reject`, {
      reason: rejectReason.value,
    });
    pendingTips.value = pendingTips.value.filter((t) => t.id !== selectedTipId.value);
    rejectModalOpen.value = false;
    await loadStats();
  } catch (err) {
    console.error('Failed to reject tip:', err);
  } finally {
    actionLoading.value = false;
  }
};

const resolveReport = async (reportId: number, action: ReportAction) => {
  actionLoading.value = true;
  try {
    await api.post(`/moderation/reports/${reportId}/resolve`, { action });
    reports.value = reports.value.filter((r) => r.id !== reportId);
    await loadStats();
  } catch (err) {
    console.error('Failed to resolve report:', err);
  } finally {
    actionLoading.value = false;
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  loadStats();
  loadPendingTips();
  loadReports();
});
</script>

<style scoped>
.moderation-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2rem;
}

.dark h1 {
  color: #f1f5f9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark .stat-card {
  background: rgb(30 41 59 / 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.dark .stat-value {
  color: #f1f5f9;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

.dark .stat-label {
  color: #94a3b8;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.tab:hover {
  color: #2563eb;
}

.tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.content-section {
  margin-top: 2rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.tips-list,
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tip-card,
.report-card {
  padding: 1.5rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark .tip-card,
.dark .report-card {
  background: rgb(30 41 59 / 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.tip-header,
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tip-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.dark .tip-header h3 {
  color: #f1f5f9;
}

.tip-date,
.report-date {
  font-size: 0.875rem;
  color: #64748b;
}

.dark .tip-date,
.dark .report-date {
  color: #94a3b8;
}

.tip-content,
.report-reason {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.dark .tip-content,
.dark .report-reason {
  color: #cbd5e1;
}

.tip-meta {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.dark .tip-meta {
  color: #94a3b8;
}

.tip-actions,
.report-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-approve {
  background: #10b981;
  color: #fff;
}

.btn-approve:hover:not(:disabled) {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
  color: #fff;
}

.btn-reject:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #cbd5e1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
}

.modal h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.modal p {
  margin-bottom: 1rem;
  color: #64748b;
}

.modal textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
  margin-bottom: 1rem;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.report-type {
  font-weight: 600;
  color: #1e293b;
}
</style>
