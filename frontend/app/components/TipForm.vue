<script setup lang="ts">
import { ref } from 'vue';
import type { TipFormData, UserPerks } from '~/types/tip';
import AppInput from './ui/AppInput.vue';
import AppTextarea from './ui/AppTextarea.vue';
import AppSelect from './ui/AppSelect.vue';
import AppButton from './ui/AppButton.vue';
import AppFileUpload from './ui/AppFileUpload.vue';
import AppMapSelector from './ui/AppMapSelector.vue';
import { API_ROUTES } from '~/config/api';

const props = defineProps<{
  initialData?: Partial<TipFormData>;
  loading?: boolean;
  // Avantages du grade : limites appliquées dans le formulaire (le backend les vérifie aussi)
  perks?: UserPerks | null;
  // Modification d'un tip existant : le type (tip / question) ne change pas
  editing?: boolean;
  // Images déjà publiées, comptées dans la limite du grade
  existingImagesCount?: number;
}>();

const emit = defineEmits<{
  (e: 'submit', data: TipFormData): void;
}>();

const MAX_CATEGORIES = 5;

const config = useRuntimeConfig();
const { data: categoriesResponse } = await useFetch<{ success: boolean; data: string[] }>(
  `${config.public.apiBaseUrl}${API_ROUTES.TIPS.CATEGORIES}`,
);
const availableCategories = computed(() => categoriesResponse.value?.data || []);

const toggleCategory = (category: string) => {
  const tags = formData.value.tags;
  if (tags.includes(category)) {
    formData.value.tags = tags.filter((tag) => tag !== category);
  } else if (tags.length < MAX_CATEGORIES) {
    formData.value.tags = [...tags, category];
  }
};

// Sans assez d'XP pour proposer un tip, le formulaire part sur une question
const formData = ref<TipFormData>({
  kind: props.initialData?.kind ?? (props.perks && !props.perks.canPublishTip ? 'QUESTION' : 'TIP'),
  title: props.initialData?.title || '',
  description: props.initialData?.description || '',
  content: props.initialData?.content || '',
  tags: props.initialData?.tags || [],
  difficulty: props.initialData?.difficulty || 1,
  address: props.initialData?.address || '',
  lat: props.initialData?.lat,
  lng: props.initialData?.lng,
  images: props.initialData?.images || [],
  documents: props.initialData?.documents || [],
});

const mapPosition = ref<{ lat: number; lng: number; address?: string } | null>(
  props.initialData?.lat && props.initialData?.lng
    ? {
        lat: props.initialData.lat,
        lng: props.initialData.lng,
        address: props.initialData.address,
      }
    : null,
);

watch(mapPosition, (newPos) => {
  if (newPos) {
    formData.value.lat = newPos.lat;
    formData.value.lng = newPos.lng;
    formData.value.address = newPos.address || formData.value.address;
  } else {
    formData.value.lat = undefined;
    formData.value.lng = undefined;
  }
});

const errors = ref<Partial<Record<keyof TipFormData, string>>>({});

const limits = computed(() => (props.perks?.enforced ? props.perks : null));
const isQuestion = computed(() => formData.value.kind === 'QUESTION');
const quotaReached = computed(() => !!limits.value && limits.value.remainingToday <= 0);

const validate = () => {
  errors.value = {};
  let isValid = true;

  if (!formData.value.title.trim()) {
    errors.value.title = 'Le titre est requis';
    isValid = false;
  }
  if (!formData.value.description.trim()) {
    errors.value.description = 'La description courte est requise';
    isValid = false;
  }
  if (!formData.value.content.trim()) {
    errors.value.content = 'Le contenu détaillé est requis';
    isValid = false;
  }
  if (limits.value) {
    const { perks } = limits.value;
    if (formData.value.kind === 'TIP' && !limits.value.canPublishTip) {
      errors.value.kind = `Il faut ${limits.value.minXpToPublishTip} XP pour proposer un tip`;
      isValid = false;
    }
    if (formData.value.content.length > perks.maxContentLength) {
      errors.value.content = `${perks.maxContentLength} caractères maximum pour votre grade`;
      isValid = false;
    }
    if (formData.value.images.length + (props.existingImagesCount ?? 0) > perks.maxImages) {
      errors.value.images = `${perks.maxImages} image(s) maximum pour votre grade`;
      isValid = false;
    }
  }
  if (formData.value.difficulty < 1 || formData.value.difficulty > 5) {
    errors.value.difficulty = 'La difficulté doit être entre 1 et 5';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = () => {
  if (validate()) {
    emit('submit', formData.value);
  }
};

const difficultyOptions = [
  { value: 1, label: 'Débutant (1/5)' },
  { value: 2, label: 'Facile (2/5)' },
  { value: 3, label: 'Intermédiaire (3/5)' },
  { value: 4, label: 'Avancé (4/5)' },
  { value: 5, label: 'Expert (5/5)' },
];
</script>

<template>
  <form class="space-y-8" @submit.prevent="handleSubmit">
    <!-- SECTION GENERALE -->
    <div class="space-y-6">
      <h3
        class="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2"
      >
        Informations Générales
      </h3>

      <!-- Type de publication -->
      <div v-if="!editing" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          v-for="option in [
            {
              kind: 'TIP' as const,
              icon: 'tabler:bulb',
              title: 'Partager un tip',
              text: 'Une astuce qui a fait ses preuves.',
            },
            {
              kind: 'QUESTION' as const,
              icon: 'tabler:help-circle',
              title: 'Poser une question',
              text: 'La communauté vous répond en commentaires.',
            },
          ]"
          :key="option.kind"
          type="button"
          class="text-left p-4 rounded-2xl border-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          :class="
            formData.kind === option.kind
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
          "
          :disabled="option.kind === 'TIP' && !!limits && !limits.canPublishTip"
          @click="formData.kind = option.kind"
        >
          <div class="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
            <Icon :name="option.icon" class="w-5 h-5 text-purple-600" /> {{ option.title }}
          </div>
          <p class="text-xs text-slate-500 mt-1">{{ option.text }}</p>
          <p
            v-if="option.kind === 'TIP' && limits && !limits.canPublishTip"
            class="text-xs text-amber-600 mt-1"
          >
            Débloqué à {{ limits.minXpToPublishTip }} XP (vous en avez {{ limits.xp }}) : posez des
            questions et commentez pour en gagner.
          </p>
        </button>
      </div>
      <p v-if="errors.kind" class="text-sm text-red-500">{{ errors.kind }}</p>

      <div
        v-if="limits && !editing"
        class="text-sm rounded-xl px-4 py-3"
        :class="
          quotaReached
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300'
        "
      >
        <template v-if="quotaReached">
          Vous avez atteint votre limite de {{ limits.perks.tipsPerDay }} publications sur 24 h.
          Montez en grade pour en publier davantage.
        </template>
        <template v-else>
          Encore {{ limits.remainingToday }} publication(s) possible(s) aujourd'hui (grade
          {{ limits.grade?.name ?? '—' }}).
        </template>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppInput
          id="title"
          v-model="formData.title"
          label="Sujet / Titre"
          placeholder="Ex: Astuce pour réparer..."
          :error="errors.title"
          required
          class="md:col-span-2"
        />

        <AppSelect
          id="difficulty"
          v-model="formData.difficulty"
          label="Niveau de complexité"
          :options="difficultyOptions"
          :error="errors.difficulty"
          required
        />

        <div>
          <span class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Catégories
            <span class="text-xs font-normal text-gray-400 ml-1">(max {{ MAX_CATEGORIES }})</span>
          </span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="category in availableCategories"
              :key="category"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
              :class="
                formData.tags.includes(category)
                  ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-white/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
              "
              @click="toggleCategory(category)"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <AppTextarea
          id="description"
          v-model="formData.description"
          label="Introduction"
          placeholder="Résumé court de votre astuce..."
          :rows="3"
          :error="errors.description"
          required
          class="md:col-span-2"
        />
      </div>
    </div>

    <!-- SECTION LOCALISATION (Optionnel) -->
    <div class="space-y-6">
      <h3
        class="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2"
      >
        Localisation <span class="text-xs font-normal text-gray-400 ml-2">(Optionnel)</span>
      </h3>
      <p
        v-if="limits && !limits.perks.canAddLocation"
        class="text-sm text-slate-500 flex items-center gap-2"
      >
        <Icon name="tabler:lock" class="w-4 h-4" />
        Ajouter une localisation est débloqué au grade
        {{ limits.nextGrade?.name ?? 'suivant' }}.
      </p>
      <div v-else class="space-y-4">
        <AppMapSelector v-model="mapPosition" label="Position sur la carte" />

        <AppInput
          id="address"
          v-model="formData.address!"
          label="Adresse / Lieu (complément)"
          placeholder="Ex: Bâtiment A, Entrée principale"
        />
        <p
          v-if="mapPosition?.address"
          class="text-xs text-emerald-600 dark:text-emerald-500 flex items-center gap-1"
        >
          <Icon name="tabler:info-circle" class="w-3 h-3" />
          Adresse détectée: {{ mapPosition.address }}
        </p>
      </div>
    </div>

    <!-- SECTION CONTENU -->
    <div class="space-y-6">
      <h3
        class="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2"
      >
        {{ isQuestion ? 'Votre question en détail' : "Détails de l'Astuce" }}
      </h3>

      <AppTextarea
        id="content"
        v-model="formData.content"
        label="Explications détaillées"
        placeholder="Décrivez toutes les étapes..."
        :rows="10"
        :error="errors.content"
        required
      />
      <p
        v-if="limits"
        class="-mt-4 text-xs text-right"
        :class="
          formData.content.length > limits.perks.maxContentLength ? 'text-red-500' : 'text-gray-400'
        "
      >
        {{ formData.content.length }} / {{ limits.perks.maxContentLength }} caractères
      </p>
    </div>

    <!-- SECTION MEDIAS -->
    <div class="space-y-6">
      <h3
        class="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2"
      >
        Médias & Documents
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppFileUpload
          id="images"
          v-model="formData.images"
          :label="limits ? `Photos / Images (${limits.perks.maxImages} max)` : 'Photos / Images'"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          :max-size="5"
          :error="errors.images"
        />

        <AppFileUpload
          id="documents"
          v-model="formData.documents"
          label="Documents (PDF, Txt...)"
          accept=".pdf,.doc,.docx,.txt"
          multiple
          :max-size="10"
        />
      </div>
    </div>

    <!-- Actions -->
    <div
      class="flex items-center justify-end gap-4 pt-6 border-t border-purple-100 dark:border-slate-800"
    >
      <AppButton variant="secondary" @click="$router.back()"> Annuler </AppButton>
      <AppButton
        type="submit"
        :loading="loading"
        :disabled="quotaReached && !editing"
        variant="primary"
      >
        <Icon name="tabler:send" class="w-5 h-5" />
        <template v-if="editing">Enregistrer les modifications</template>
        <template v-else>{{ isQuestion ? 'Publier la question' : "Publier l'Astuce" }}</template>
      </AppButton>
    </div>
  </form>
</template>
