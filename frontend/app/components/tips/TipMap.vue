<script setup lang="ts">
import { ref } from 'vue';
// Leaflet imports are handled by Nuxt module or global import in parent, but good to be explicit for types if needed
// However, since we use @vue-leaflet/vue-leaflet, we might need to import LMap etc if not auto-imported
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{
  lat?: number;
  lng?: number;
  address?: string;
}>();

const isMapExpanded = ref(false);
const mapRef = ref(null);

const toggleMap = () => {
  isMapExpanded.value = !isMapExpanded.value;
  // Hack resize Leaflet
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);
};
</script>

<template>
  <div v-if="lat && lng">
    <!-- Normal Card -->
    <div
      class="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-4xl p-2 shadow-lg border border-white/40 dark:border-white/5 ring-1 ring-white/20 relative group"
    >
      <button
        class="absolute top-4 right-4 z-[40] bg-white text-slate-800 p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-105"
        title="Agrandir la carte"
        @click="toggleMap"
      >
        <Icon name="tabler:maximize" class="w-5 h-5" />
      </button>

      <div class="px-5 py-4 flex items-center justify-between">
        <span
          class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2"
        >
          <Icon name="tabler:map-pin" /> Localisation
        </span>
        <span
          class="text-xs font-bold text-slate-800 dark:text-white bg-white/50 dark:bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm"
        >
          {{ address }}
        </span>
      </div>
      <div
        class="h-48 rounded-3xl overflow-hidden relative z-0 opacity-90 hover:opacity-100 transition-opacity"
      >
        <ClientOnly>
          <LMap ref="mapRef" :zoom="13" :center="[lat, lng]" :use-global-leaflet="false">
            <LTileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              layer-type="base"
              name="OpenStreetMap"
            />
            <LMarker :lat-lng="[lat, lng]" />
          </LMap>
        </ClientOnly>
      </div>
    </div>

    <!-- Expanded Overlay -->
    <Teleport to="body">
      <div
        v-if="isMapExpanded"
        class="fixed inset-0 z-90 bg-white dark:bg-slate-900 flex flex-col animate-fade-in"
      >
        <div
          class="p-4 flex justify-between items-center border-b border-gray-200 dark:border-slate-800 bg-white/50 backdrop-blur-md"
        >
          <h3 class="font-bold text-lg flex items-center gap-2">
            <Icon name="tabler:map" class="w-5 h-5 text-purple-600" />
            Carte: {{ address }}
          </h3>
          <button
            class="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition font-medium text-sm flex items-center gap-2"
            @click="toggleMap"
          >
            <Icon name="tabler:minimize" class="w-4 h-4" />
            Réduire
          </button>
        </div>
        <div class="flex-1 relative z-0">
          <ClientOnly>
            <LMap :zoom="15" :center="[lat, lng]" :use-global-leaflet="false">
              <LTileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                layer-type="base"
                name="OpenStreetMap"
              />
              <LMarker :lat-lng="[lat, lng]" />
            </LMap>
          </ClientOnly>
        </div>
      </div>
    </Teleport>
  </div>
</template>
