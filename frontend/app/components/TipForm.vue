<script setup lang="ts">
import { ref } from 'vue';
import type { TipFormData } from '~/types/tip';
import AppInput from './ui/AppInput.vue';
import AppTextarea from './ui/AppTextarea.vue';
import AppSelect from './ui/AppSelect.vue';
import AppTagsInput from './ui/AppTagsInput.vue';
import AppButton from './ui/AppButton.vue';
import AppFileUpload from './ui/AppFileUpload.vue';
import AppMapSelector from './ui/AppMapSelector.vue';

const props = defineProps<{
  initialData?: Partial<TipFormData>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', data: TipFormData): void;
}>();

const formData = ref<TipFormData>({
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

        <AppTagsInput
          id="tags"
          v-model="formData.tags"
          label="Mots-clés (Tags)"
          placeholder="Bricolage, Cuisine, Code..."
          :max-tags="5"
        />

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
      <div class="space-y-4">
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
        Détails de l'Astuce
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
          label="Photos / Images"
          accept="image/*"
          multiple
          :max-size="5"
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
      <AppButton type="submit" :loading="loading" variant="primary">
        <Icon name="tabler:send" class="w-5 h-5" />
        Publier l'Astuce
      </AppButton>
    </div>
  </form>
</template>
