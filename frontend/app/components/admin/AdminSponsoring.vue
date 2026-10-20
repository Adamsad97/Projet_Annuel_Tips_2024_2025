<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type {
  AdminCampaign,
  AdminChallenge,
  AdminGrade,
  AdStats,
  AdStatus,
  Category,
} from '~/types';
import { API_ROUTES } from '~/config/api';
import { storage } from '~/utils/storage';

const api = useApi();
const toast = useToastMessage();
const config = useRuntimeConfig();

const campaigns = ref<AdminCampaign[]>([]);
const challenges = ref<AdminChallenge[]>([]);
const categories = ref<Category[]>([]);
const grades = ref<AdminGrade[]>([]);
const stats = ref<AdStats | null>(null);
const saving = ref(false);

const STATUS_LABELS: Record<AdStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-slate-500/10 text-slate-600' },
  ACTIVE: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-600' },
  PAUSED: { label: 'En pause', color: 'bg-amber-500/10 text-amber-600' },
  ENDED: { label: 'Terminée', color: 'bg-red-500/10 text-red-600' },
};

// <input type="datetime-local"> <-> ISO
const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '');
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);
const nowLocal = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

// ---------- Campagnes ----------

const emptyCampaign = () => ({
  id: null as number | null,
  name: '',
  sponsorName: '',
  title: '',
  body: '',
  imageUrl: null as string | null,
  targetUrl: 'https://',
  status: 'DRAFT' as AdStatus,
  audience: 'ALL' as 'ALL' | 'MEMBERS' | 'GUESTS',
  targetCategoryIds: [] as number[],
  targetGradeIds: [] as number[],
  startsAt: nowLocal(),
  endsAt: '',
  maxImpressions: null as number | null,
  priority: 0,
});
const draft = reactive(emptyCampaign());
const showCampaignForm = ref(false);

const load = async () => {
  try {
    [campaigns.value, challenges.value, categories.value, grades.value] = await Promise.all([
      api.get<AdminCampaign[]>(API_ROUTES.ADMIN.ADS),
      api.get<AdminChallenge[]>(API_ROUTES.ADMIN.CHALLENGES),
      api.get<Category[]>(API_ROUTES.CATEGORIES.LIST),
      api.get<AdminGrade[]>(API_ROUTES.ADMIN.GRADES),
    ]);
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

const editCampaign = (campaign?: AdminCampaign) => {
  Object.assign(
    draft,
    emptyCampaign(),
    campaign
      ? {
          ...campaign,
          startsAt: toLocalInput(campaign.startsAt),
          endsAt: toLocalInput(campaign.endsAt),
        }
      : {},
  );
  showCampaignForm.value = true;
};

const uploadImage = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('image', file);
  try {
    const { imageUrl } = await api.post<{ imageUrl: string }>(API_ROUTES.ADMIN.AD_IMAGE, formData);
    draft.imageUrl = imageUrl;
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

const saveCampaign = async () => {
  const { id, ...fields } = draft;
  const body = {
    ...fields,
    startsAt: toIso(draft.startsAt),
    endsAt: toIso(draft.endsAt),
    maxImpressions: draft.maxImpressions ? Number(draft.maxImpressions) : null,
    priority: Number(draft.priority),
  };

  saving.value = true;
  try {
    if (id) await api.patch(API_ROUTES.ADMIN.AD(id), body);
    else await api.post(API_ROUTES.ADMIN.ADS, body);
    toast.success(id ? 'Campagne mise à jour' : 'Campagne créée');
    showCampaignForm.value = false;
    await load();
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    saving.value = false;
  }
};

const setStatus = async (campaign: AdminCampaign, status: AdStatus) => {
  try {
    await api.patch(API_ROUTES.ADMIN.AD(campaign.id), { status });
    await load();
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

const deleteCampaign = async (campaign: AdminCampaign) => {
  if (!confirm(`Supprimer la campagne « ${campaign.name} » et ses statistiques ?`)) return;
  try {
    await api.delete(API_ROUTES.ADMIN.AD(campaign.id));
    if (stats.value?.campaign.id === campaign.id) stats.value = null;
    await load();
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

const showStats = async (campaign: AdminCampaign) => {
  try {
    stats.value = await api.get<AdStats>(API_ROUTES.ADMIN.AD_STATS(campaign.id));
  } catch {
    stats.value = null;
  }
};

const maxDailyImpressions = computed(() =>
  Math.max(1, ...(stats.value?.days.map((day) => day.impressions) ?? [1])),
);

// Téléchargement authentifié du rapport CSV
const downloadCsv = async (campaignId: number) => {
  try {
    const token = storage.getAccessToken();
    const blob = await $fetch<Blob>(API_ROUTES.ADMIN.AD_STATS_CSV(campaignId), {
      baseURL: config.public.apiBaseUrl,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: 'blob',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `campagne-${campaignId}-statistiques.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch {
    toast.error('Export CSV impossible');
  }
};

const toggleId = (list: number[], id: number) => {
  const index = list.indexOf(id);
  if (index >= 0) list.splice(index, 1);
  else list.push(id);
};

// ---------- Défis sponsorisés ----------

const emptyChallenge = () => ({
  id: null as number | null,
  sponsorName: '',
  title: '',
  description: '',
  categoryId: 0,
  xpBonus: 50,
  startsAt: nowLocal(),
  endsAt: '',
  maxRewards: null as number | null,
  isActive: true,
});
const challengeDraft = reactive(emptyChallenge());
const showChallengeForm = ref(false);

const editChallenge = (challenge?: AdminChallenge) => {
  Object.assign(
    challengeDraft,
    emptyChallenge(),
    challenge
      ? {
          ...challenge,
          startsAt: toLocalInput(challenge.startsAt),
          endsAt: toLocalInput(challenge.endsAt),
        }
      : { categoryId: categories.value[0]?.id ?? 0 },
  );
  showChallengeForm.value = true;
};

const saveChallenge = async () => {
  const { id, ...fields } = challengeDraft;
  const body = {
    sponsorName: fields.sponsorName,
    title: fields.title,
    description: fields.description,
    categoryId: Number(fields.categoryId),
    xpBonus: Number(fields.xpBonus),
    startsAt: toIso(fields.startsAt),
    endsAt: toIso(fields.endsAt),
    maxRewards: fields.maxRewards ? Number(fields.maxRewards) : null,
    isActive: fields.isActive,
  };

  saving.value = true;
  try {
    if (id) await api.patch(API_ROUTES.ADMIN.CHALLENGE(id), body);
    else await api.post(API_ROUTES.ADMIN.CHALLENGES, body);
    toast.success(id ? 'Défi mis à jour' : 'Défi créé');
    showChallengeForm.value = false;
    await load();
  } catch {
    // l'erreur est déjà affichée par useApi
  } finally {
    saving.value = false;
  }
};

const deleteChallenge = async (challenge: AdminChallenge) => {
  if (!confirm(`Supprimer le défi « ${challenge.title} » ?`)) return;
  try {
    await api.delete(API_ROUTES.ADMIN.CHALLENGE(challenge.id));
    await load();
  } catch {
    // l'erreur est déjà affichée par useApi
  }
};

const inputClass =
  'w-full p-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-purple-500';

onMounted(load);
</script>

<template>
  <div class="space-y-10">
    <p class="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
      Les tips sponsorisés apparaissent dans les listes, toujours marqués « Sponsorisé ». Seules des
      statistiques agrégées sont collectées (affichages et clics par jour), sans suivi individuel.
      La publicité peut être coupée ou testée sur une partie des membres via le flag
      <code>ads</code> de l'onglet Fonctionnalités.
    </p>

    <!-- ========== Campagnes ========== -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Tips sponsorisés</h3>
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700"
          @click="editCampaign()"
        >
          Nouvelle campagne
        </button>
      </div>

      <p v-if="campaigns.length === 0" class="text-sm text-slate-500">Aucune campagne.</p>
      <div v-else class="overflow-x-auto rounded-2xl bg-white/70 dark:bg-slate-800/60">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-slate-500 uppercase">
              <th class="p-3">Campagne</th>
              <th class="p-3">Statut</th>
              <th class="p-3">Période</th>
              <th class="p-3 text-right">Affichages</th>
              <th class="p-3 text-right">Clics</th>
              <th class="p-3 text-right">CTR</th>
              <th class="p-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="campaign in campaigns"
              :key="campaign.id"
              class="border-t border-slate-100 dark:border-slate-700 align-top"
            >
              <td class="p-3">
                <div class="font-bold">{{ campaign.name }}</div>
                <div class="text-xs text-slate-500">
                  {{ campaign.sponsorName }} · {{ campaign.title }}
                </div>
              </td>
              <td class="p-3">
                <span
                  class="px-2 py-0.5 rounded text-xs font-bold"
                  :class="STATUS_LABELS[campaign.status].color"
                >
                  {{ STATUS_LABELS[campaign.status].label }}
                </span>
              </td>
              <td class="p-3 text-xs text-slate-500">
                {{ new Date(campaign.startsAt).toLocaleDateString('fr-FR') }}
                →
                {{ campaign.endsAt ? new Date(campaign.endsAt).toLocaleDateString('fr-FR') : '∞' }}
                <div v-if="campaign.maxImpressions">
                  budget {{ campaign.maxImpressions.toLocaleString('fr-FR') }} affichages
                </div>
              </td>
              <td class="p-3 text-right tabular-nums">
                {{ campaign.totals.impressions.toLocaleString('fr-FR') }}
              </td>
              <td class="p-3 text-right tabular-nums">
                {{ campaign.totals.clicks.toLocaleString('fr-FR') }}
              </td>
              <td class="p-3 text-right tabular-nums">{{ campaign.totals.ctr }} %</td>
              <td class="p-3">
                <div class="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs font-bold">
                  <button class="text-purple-600 hover:underline" @click="showStats(campaign)">
                    Statistiques
                  </button>
                  <button class="text-purple-600 hover:underline" @click="editCampaign(campaign)">
                    Modifier
                  </button>
                  <button
                    v-if="campaign.status === 'ACTIVE'"
                    class="text-amber-600 hover:underline"
                    @click="setStatus(campaign, 'PAUSED')"
                  >
                    Pause
                  </button>
                  <button
                    v-else-if="campaign.status !== 'ENDED'"
                    class="text-emerald-600 hover:underline"
                    @click="setStatus(campaign, 'ACTIVE')"
                  >
                    Activer
                  </button>
                  <button class="text-red-500 hover:underline" @click="deleteCampaign(campaign)">
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Statistiques d'une campagne -->
      <div v-if="stats" class="rounded-2xl bg-white/70 dark:bg-slate-800/60 p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="font-bold">
            {{ stats.campaign.name }} —
            {{ stats.totals.impressions.toLocaleString('fr-FR') }} affichages,
            {{ stats.totals.clicks.toLocaleString('fr-FR') }} clics, CTR {{ stats.totals.ctr }} %
          </h4>
          <div class="flex gap-3 text-xs font-bold">
            <button class="text-purple-600 hover:underline" @click="downloadCsv(stats.campaign.id)">
              Exporter en CSV
            </button>
            <button class="text-slate-500 hover:underline" @click="stats = null">Fermer</button>
          </div>
        </div>
        <p v-if="stats.days.length === 0" class="text-sm text-slate-500">
          Aucun affichage pour le moment.
        </p>
        <div v-else class="flex items-end gap-1 h-32" role="img" aria-label="Affichages par jour">
          <div
            v-for="day in stats.days"
            :key="day.day"
            class="flex-1 rounded-t bg-amber-400/80 hover:bg-amber-500 min-h-[2px]"
            :style="{ height: `${(day.impressions / maxDailyImpressions) * 100}%` }"
            :title="`${day.day} : ${day.impressions} affichages, ${day.clicks} clics (${day.ctr} %)`"
          />
        </div>
      </div>

      <!-- Formulaire de campagne -->
      <div
        v-if="showCampaignForm"
        class="rounded-2xl border-2 border-dashed border-purple-200 dark:border-slate-700 p-5 space-y-4"
      >
        <h4 class="font-bold">{{ draft.id ? 'Modifier la campagne' : 'Nouvelle campagne' }}</h4>
        <div class="grid md:grid-cols-2 gap-3">
          <input
            v-model="draft.name"
            placeholder="Nom interne de la campagne"
            :class="inputClass"
          />
          <input v-model="draft.sponsorName" placeholder="Nom du partenaire" :class="inputClass" />
          <input
            v-model="draft.title"
            placeholder="Titre affiché"
            :class="inputClass"
            class="md:col-span-2"
          />
          <textarea
            v-model="draft.body"
            rows="2"
            placeholder="Texte (10 à 500 caractères)"
            :class="inputClass"
            class="md:col-span-2"
          />
          <input
            v-model="draft.targetUrl"
            placeholder="https://site-du-partenaire…"
            :class="inputClass"
            class="md:col-span-2"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3 text-sm">
          <label class="font-medium">Image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            @change="uploadImage"
          />
          <span v-if="draft.imageUrl" class="text-xs text-emerald-600">Image enregistrée</span>
        </div>

        <div class="grid md:grid-cols-3 gap-3 text-sm">
          <label class="space-y-1">
            <span class="font-medium">Statut</span>
            <select v-model="draft.status" :class="inputClass">
              <option v-for="(value, key) in STATUS_LABELS" :key="key" :value="key">
                {{ value.label }}
              </option>
            </select>
          </label>
          <label class="space-y-1">
            <span class="font-medium">Audience</span>
            <select v-model="draft.audience" :class="inputClass">
              <option value="ALL">Tout le monde</option>
              <option value="MEMBERS">Membres connectés</option>
              <option value="GUESTS">Visiteurs</option>
            </select>
          </label>
          <label class="space-y-1">
            <span class="font-medium">Priorité (0-100)</span>
            <input
              v-model.number="draft.priority"
              type="number"
              min="0"
              max="100"
              :class="inputClass"
            />
          </label>
          <label class="space-y-1">
            <span class="font-medium">Début</span>
            <input v-model="draft.startsAt" type="datetime-local" :class="inputClass" />
          </label>
          <label class="space-y-1">
            <span class="font-medium">Fin (vide = sans fin)</span>
            <input v-model="draft.endsAt" type="datetime-local" :class="inputClass" />
          </label>
          <label class="space-y-1">
            <span class="font-medium">Budget d'affichages (vide = illimité)</span>
            <input
              v-model.number="draft.maxImpressions"
              type="number"
              min="1"
              :class="inputClass"
            />
          </label>
        </div>

        <div class="space-y-2 text-sm">
          <p class="font-medium">
            Catégories ciblées <span class="text-slate-400">(aucune = toutes)</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="px-3 py-1 rounded-lg text-xs font-bold border"
              :class="
                draft.targetCategoryIds.includes(category.id)
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-slate-300 dark:border-slate-600'
              "
              @click="toggleId(draft.targetCategoryIds, category.id)"
            >
              {{ category.name }}
            </button>
          </div>
          <p class="font-medium">
            Grades ciblés <span class="text-slate-400">(aucun = tous)</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="grade in grades"
              :key="grade.id"
              type="button"
              class="px-3 py-1 rounded-lg text-xs font-bold border"
              :class="
                draft.targetGradeIds.includes(grade.id)
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-slate-300 dark:border-slate-600'
              "
              @click="toggleId(draft.targetGradeIds, grade.id)"
            >
              {{ grade.name }}
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
            :disabled="saving"
            @click="saveCampaign"
          >
            Enregistrer
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-sm"
            @click="showCampaignForm = false"
          >
            Annuler
          </button>
        </div>
      </div>
    </section>

    <!-- ========== Défis sponsorisés ========== -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">Défis sponsorisés</h3>
          <p class="text-sm text-slate-500">
            Bonus d'XP versé automatiquement pour le premier tip validé dans la catégorie pendant la
            période (une fois par membre, dans la limite du nombre de récompenses).
          </p>
        </div>
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
          @click="editChallenge()"
        >
          Nouveau défi
        </button>
      </div>

      <p v-if="challenges.length === 0" class="text-sm text-slate-500">Aucun défi.</p>
      <ul v-else class="space-y-2">
        <li
          v-for="challenge in challenges"
          :key="challenge.id"
          class="rounded-xl bg-white/70 dark:bg-slate-800/60 p-4 flex flex-wrap items-center justify-between gap-3"
          :class="{ 'opacity-60': !challenge.isActive }"
        >
          <div>
            <div class="font-bold">
              {{ challenge.title }}
              <span class="text-emerald-600">+{{ challenge.xpBonus }} XP</span>
            </div>
            <div class="text-xs text-slate-500">
              {{ challenge.sponsorName }} · #{{ challenge.category.name }} ·
              {{ new Date(challenge.startsAt).toLocaleDateString('fr-FR') }} →
              {{ new Date(challenge.endsAt).toLocaleDateString('fr-FR') }} ·
              {{ challenge.rewardsGiven
              }}{{ challenge.maxRewards ? ` / ${challenge.maxRewards}` : '' }}
              récompense(s)
              <template v-if="!challenge.isActive"> · désactivé</template>
            </div>
          </div>
          <div class="flex gap-3 text-xs font-bold">
            <button class="text-purple-600 hover:underline" @click="editChallenge(challenge)">
              Modifier
            </button>
            <button class="text-red-500 hover:underline" @click="deleteChallenge(challenge)">
              Supprimer
            </button>
          </div>
        </li>
      </ul>

      <div
        v-if="showChallengeForm"
        class="rounded-2xl border-2 border-dashed border-emerald-200 dark:border-slate-700 p-5 space-y-3"
      >
        <h4 class="font-bold">{{ challengeDraft.id ? 'Modifier le défi' : 'Nouveau défi' }}</h4>
        <div class="grid md:grid-cols-2 gap-3 text-sm">
          <input
            v-model="challengeDraft.sponsorName"
            placeholder="Partenaire"
            :class="inputClass"
          />
          <input v-model="challengeDraft.title" placeholder="Titre du défi" :class="inputClass" />
          <textarea
            v-model="challengeDraft.description"
            rows="2"
            placeholder="Description (10 à 500 caractères)"
            :class="inputClass"
            class="md:col-span-2"
          />
          <label class="space-y-1">
            <span class="font-medium">Catégorie</span>
            <select v-model.number="challengeDraft.categoryId" :class="inputClass">
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </label>
          <label class="space-y-1">
            <span class="font-medium">Bonus d'XP</span>
            <input
              v-model.number="challengeDraft.xpBonus"
              type="number"
              min="1"
              max="1000"
              :class="inputClass"
            />
          </label>
          <label class="space-y-1">
            <span class="font-medium">Début</span>
            <input v-model="challengeDraft.startsAt" type="datetime-local" :class="inputClass" />
          </label>
          <label class="space-y-1">
            <span class="font-medium">Fin</span>
            <input v-model="challengeDraft.endsAt" type="datetime-local" :class="inputClass" />
          </label>
          <label class="space-y-1">
            <span class="font-medium">Récompenses max (vide = illimité)</span>
            <input
              v-model.number="challengeDraft.maxRewards"
              type="number"
              min="1"
              :class="inputClass"
            />
          </label>
          <label class="flex items-center gap-2 self-end pb-2">
            <input v-model="challengeDraft.isActive" type="checkbox" /> Actif
          </label>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
            :disabled="saving || !challengeDraft.endsAt"
            @click="saveChallenge"
          >
            Enregistrer
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-sm"
            @click="showChallengeForm = false"
          >
            Annuler
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
