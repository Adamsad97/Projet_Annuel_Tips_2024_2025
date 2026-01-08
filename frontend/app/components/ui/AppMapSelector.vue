<script setup lang="ts">
import { LMap, LTileLayer, LMarker, LIcon } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  modelValue?: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Sélectionner une position',
});

const emit = defineEmits<{
  'update:modelValue': [
    value: {
      lat: number;
      lng: number;
      address?: string;
    } | null,
  ];
}>();

const colorMode = useColorMode();
const showMap = ref(false);
const isLoadingAddress = ref(false);
const selectedPosition = ref<{ lat: number; lng: number; address?: string } | null>(
  props.modelValue || null,
);

const mapCenter = ref<[number, number]>([46.603354, 1.888334]);
const zoom = ref(5);
const mapRef = ref<any>(null);

const setPosition = (lat: number, lng: number, address?: string) => {
  selectedPosition.value = { lat, lng, address };
  emit('update:modelValue', selectedPosition.value);
};

watch(
  () => props.modelValue,
  (val) => {
    selectedPosition.value = val || null;
  },
);

watch(showMap, (val) => {
  if (val && selectedPosition.value) {
    mapCenter.value = [selectedPosition.value.lat, selectedPosition.value.lng];
    zoom.value = 13;

    nextTick(() => {
      setTimeout(() => {
        if (mapRef.value?.leafletObject) {
          mapRef.value.leafletObject.invalidateSize();
        }
      }, 200);
    });
  }
});

const tileUrl = computed(() => {
  return colorMode.value === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
});

const attribution = computed(() => {
  return colorMode.value === 'dark'
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
});

const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
  try {
    isLoadingAddress.value = true;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AideFlash-Tips-App',
        },
      },
    );

    if (!response.ok) return undefined;

    const data = await response.json();
    return data.display_name;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return undefined;
  } finally {
    isLoadingAddress.value = false;
  }
};

const onMapClick = async (event: any) => {
  console.log('[MapSelector] Map clicked:', event);

  if (!event || !event.latlng) {
    console.warn('[MapSelector] Invalid click event:', event);
    return;
  }

  const { lat, lng } = event.latlng;
  console.log('[MapSelector] Coordinates:', lat, lng);

  mapCenter.value = [lat, lng];
  zoom.value = Math.max(zoom.value, 13);

  setPosition(lat, lng);

  const address = await reverseGeocode(lat, lng);
  if (address) setPosition(lat, lng, address);
};

const onMapReady = () => {
  console.log('[MapSelector] Map is ready');

  if (mapRef.value?.leafletObject) {
    setTimeout(() => {
      mapRef.value.leafletObject.invalidateSize();
    }, 100);
  }
};

const confirmSelection = () => {
  emit('update:modelValue', selectedPosition.value);
  showMap.value = false;
};

const clearSelection = () => {
  selectedPosition.value = null;
  emit('update:modelValue', null);
};

const locateMe = () => {
  if (!navigator.geolocation) {
    alert('Géolocalisation non supportée par votre navigateur');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      mapCenter.value = [latitude, longitude];
      zoom.value = 13;

      setPosition(latitude, longitude);

      const address = await reverseGeocode(latitude, longitude);
      if (address) setPosition(latitude, longitude, address);
    },
    (error) => {
      console.error('Geolocation error:', error);
      alert('Impossible de récupérer votre position');
    },
  );
};
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>

    <!-- Display selected position -->
    <div
      v-if="modelValue"
      class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 space-y-2"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 space-y-1">
          <div
            class="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            <Icon name="tabler:map-pin" class="w-4 h-4" />
            Position sélectionnée
          </div>
          <p class="text-xs text-emerald-600 dark:text-emerald-500">
            {{ modelValue.address || `${modelValue.lat.toFixed(6)}, ${modelValue.lng.toFixed(6)}` }}
          </p>
          <p class="text-xs text-emerald-500 dark:text-emerald-600">
            Lat: {{ modelValue.lat.toFixed(6) }}, Lng: {{ modelValue.lng.toFixed(6) }}
          </p>
        </div>
        <button
          type="button"
          @click="clearSelection"
          class="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/30 transition-colors"
          title="Supprimer"
        >
          <Icon name="tabler:x" class="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        </button>
      </div>
    </div>

    <!-- Button to open map selector -->
    <button
      type="button"
      @click="showMap = true"
      class="w-full px-4 py-3 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 group"
    >
      <div class="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400">
        <Icon
          name="tabler:map-pin-plus"
          class="w-5 h-5 group-hover:scale-110 transition-transform"
        />
        <span class="font-medium">
          {{ modelValue ? 'Modifier la position' : 'Sélectionner sur la carte' }}
        </span>
      </div>
    </button>

    <!-- Map Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showMap"
          class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          @click="showMap = false"
        >
          <div
            class="relative w-full max-w-4xl h-[80vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div
              class="absolute top-0 left-0 right-0 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-purple-100 dark:border-slate-800 p-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold text-slate-800 dark:text-white">
                    Sélectionner une position
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cliquez sur la carte pour choisir l'emplacement
                  </p>
                </div>
                <button
                  type="button"
                  @click="showMap = false"
                  class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Icon name="tabler:x" class="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              <!-- Locate Me Button -->
              <button
                type="button"
                @click="locateMe"
                class="mt-3 px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 font-medium text-sm flex items-center gap-2 transition-colors"
              >
                <Icon name="tabler:current-location" class="w-4 h-4" />
                Me localiser
              </button>
            </div>

            <!-- Map -->
            <div class="absolute inset-0 top-28">
              <ClientOnly>
                <LMap
                  ref="mapRef"
                  v-model:zoom="zoom"
                  v-model:center="mapCenter"
                  :use-global-leaflet="false"
                  class="h-full w-full"
                  @click="onMapClick"
                  @ready="onMapReady"
                >
                  <LTileLayer :url="tileUrl" :attribution="attribution" />

                  <!-- Selected position marker -->
                  <LMarker
                    v-if="selectedPosition"
                    :lat-lng="[selectedPosition.lat, selectedPosition.lng]"
                    :z-index-offset="1000"
                  >
                    <LIcon
                      icon-url="/pin.svg"
                      :icon-size="[40, 40]"
                      :icon-anchor="[20, 40]"
                      class-name="drop-shadow-lg animate-bounce"
                    />
                  </LMarker>
                </LMap>
              </ClientOnly>

              <!-- Loading overlay for address -->
              <Transition name="fade">
                <div
                  v-if="isLoadingAddress"
                  class="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg text-sm flex items-center gap-2"
                >
                  <Icon name="tabler:loader-2" class="w-4 h-4 animate-spin" />
                  Récupération de l'adresse...
                </div>
              </Transition>

              <!-- Selected position info -->
              <Transition name="slide-up">
                <div
                  v-if="selectedPosition"
                  class="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-purple-100 dark:border-slate-800"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 space-y-1">
                      <p class="text-sm font-semibold text-slate-800 dark:text-white">
                        Position sélectionnée
                      </p>
                      <p class="text-xs text-slate-600 dark:text-slate-400">
                        {{
                          selectedPosition.address ||
                          `${selectedPosition.lat.toFixed(6)}, ${selectedPosition.lng.toFixed(6)}`
                        }}
                      </p>
                    </div>
                    <button
                      type="button"
                      @click="confirmSelection"
                      class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-colors flex items-center gap-2"
                    >
                      <Icon name="tabler:check" class="w-4 h-4" />
                      Confirmer
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
