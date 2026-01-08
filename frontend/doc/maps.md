# Leaflet Maps

## Pages

- **`/map`** - Display tips on map
- **`AppMapSelector`** - Component for location selection

## Basic Usage

```vue
<LMap v-model:center="center" v-model:zoom="zoom">
  <LTileLayer url="..." />
  <LMarker v-for="tip in tips" :lat-lng="[tip.lat, tip.lng]" />
</LMap>
```

## Features

- Automatic clustering of nearby markers
- User geolocation with `navigator.geolocation`
- Custom icons with `L.icon()`
- CSS import required: `import 'leaflet/dist/leaflet.css'`

**Obligatoire:** OpenStreetMap exige l'affichage de l'attribution.

```vue
<LTileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
/>
```

