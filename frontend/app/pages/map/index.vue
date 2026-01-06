<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LIcon, LControlZoom } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';

definePageMeta({
  middleware: 'auth',
});

const { data: fetchedTips } = await useFetch<Tip[]>('/api/tips');

const tips = computed(() => {
  return (fetchedTips.value || [])
    .filter((t) => t.lat && t.lng)
    .map((t) => ({
      id: t.id,
      title: t.title,
      lat: t.lat!,
      lng: t.lng!,
      country: t.address ? t.address.split(',').pop()?.trim() || 'France' : 'France',
      date: t.created_at ? t.created_at.split('T')[0] || '2024-01-01' : '2024-01-01',
      category: t.tags[0] || 'Général',
      address: t.address,
    }));
});

const filters = ref({ country: '', dateStart: '', dateEnd: '' });
const zoom = ref(5);
const center = ref([46.603354, 1.888334]); // France center
const mapRef = ref<InstanceType<typeof LMap> | null>(null);
const colorMode = useColorMode();

const filteredTips = computed(() => {
  return tips.value.filter((tip) => {
    const matchCountry = !filters.value.country || tip.country === filters.value.country;
    const d = new Date(tip.date);
    const start = filters.value.dateStart ? new Date(filters.value.dateStart) : null;
    const end = filters.value.dateEnd ? new Date(filters.value.dateEnd) : null;
    return matchCountry && (!start || d >= start) && (!end || d <= end);
  });
});

const countries = computed(() => [...new Set(tips.value.map((t) => t.country))]);

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

const onFilterChange = async () => {
  await nextTick();

  if (filteredTips.value.length === 0) return;

  if (filteredTips.value.length === 1) {
    const tip = filteredTips.value[0];
    center.value = [tip.lat, tip.lng];
    zoom.value = 10;
    return;
  }

  const bounds = filteredTips.value.map((t) => [t.lat, t.lng]);

  if (mapRef.value && mapRef.value.leafletObject) {
    mapRef.value.leafletObject.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 12,
    });
  }
};
</script>

<template>
  <div
    class="relative w-full flex flex-col overflow-hidden rounded-3xl border border-purple-100/50 dark:border-slate-700/50 shadow-xl bg-white dark:bg-slate-900 transition-all duration-300 group"
    style="height: calc(100vh - 12rem)"
  >
    <!-- OVERLAY FILTRES (Glassmorphism Flottant) -->
    <div
      class="absolute top-4 left-4 right-4 z-[400] pointer-events-none flex justify-center md:justify-start"
    >
      <div
        class="pointer-events-auto inline-flex flex-wrap items-center justify-center gap-3 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-purple-100/50 dark:border-slate-700/50 transition-all duration-300 max-w-full"
      >
        <!-- Filtre Pays -->
        <div class="relative">
          <select
            v-model="filters.country"
            class="appearance-none pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
            @change="onFilterChange"
          >
            <option value="">🌍 Monde</option>
            <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
          </select>
          <Icon
            name="tabler:map-pin"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
          <Icon
            name="tabler:chevron-down"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"
          />
        </div>

        <div class="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        <!-- Filtres Date -->
        <div
          class="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 rounded-xl px-3 py-1 border border-gray-200 dark:border-slate-600 flex-wrap justify-center"
        >
          <Icon name="tabler:calendar" class="w-4 h-4 text-gray-400" />
          <input
            v-model="filters.dateStart"
            type="date"
            class="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none w-24"
            placeholder="Début"
            @change="onFilterChange"
          />
          <span class="text-gray-300 dark:text-slate-600">→</span>
          <input
            v-model="filters.dateEnd"
            type="date"
            class="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none w-24"
            placeholder="Fin"
            @change="onFilterChange"
          />
        </div>

        <!-- Compteur Résultats -->
        <div
          class="ml-auto px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          {{ filteredTips.length }} tips
        </div>
      </div>
    </div>

    <!-- MAP CONTAINER -->
    <div class="flex-1 w-full h-full z-0 bg-gray-100 dark:bg-slate-950">
      <ClientOnly>
        <LMap
          ref="mapRef"
          v-model:zoom="zoom"
          v-model:center="center"
          :use-global-leaflet="false"
          :options="{ zoomControl: false }"
          class="h-full w-full z-0"
        >
          <LTileLayer :url="tileUrl" layer-type="base" name="BaseMap" :attribution="attribution" />

          <!-- CONTRÔLE DE ZOOM DÉPLACÉ EN BAS À DROITE -->
          <LControlZoom position="bottomright" />

          <LMarker v-for="tip in filteredTips" :key="tip.id" :lat-lng="[tip.lat, tip.lng]">
            <LIcon
              icon-url="/pin.svg"
              :icon-size="[40, 40]"
              :icon-anchor="[20, 40]"
              :popup-anchor="[0, -40]"
              class-name="drop-shadow-md transition-transform duration-200"
            />
            <LPopup :options="{ closeButton: false, offset: [0, -10] }">
              <div class="w-48 p-1 font-sans text-slate-800 dark:text-slate-900">
                <div class="text-[10px] font-bold text-purple-600 uppercase mb-1 tracking-wider">
                  {{ tip.category }}
                </div>
                <h3 class="font-bold text-base leading-tight mb-1">{{ tip.title }}</h3>
                <div class="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <Icon name="tabler:calendar" class="w-3 h-3" /> {{ tip.date }}
                </div>
                <NuxtLink
                  :to="`/tips/${tip.id}`"
                  class="block w-full text-center py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-purple-600 transition-colors"
                >
                  Voir le détail</NuxtLink
                >
              </div>
            </LPopup>
          </LMarker>
        </LMap>
      </ClientOnly>
    </div>
  </div>
</template>

<style>
/* CSS inchangé, je garde tes styles custom */
.leaflet-popup-content-wrapper {
  border-radius: 1rem;
  box-shadow:
    0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
  border: 1px solid rgba(216, 180, 254, 0.5);
  overflow: hidden;
  padding: 0 !important;
}

.leaflet-popup-content {
  margin: 0 !important;
}

.leaflet-popup-tip {
  box-shadow: none !important;
}

:global(.dark) .leaflet-layer,
:global(.dark) .leaflet-control-attribution {
  filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
}

/* On ne filtre PAS les boutons de zoom ici car ils sont déplacés, on laisse le style par défaut ou on le surcharge si besoin */
:global(.dark) .leaflet-tile-pane {
  filter: none !important;
}
</style>
