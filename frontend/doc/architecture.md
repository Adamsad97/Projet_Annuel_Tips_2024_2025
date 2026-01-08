# Architecture

## Folder Structure

- **`components/`** - Vue components (auto-imported)
- **`composables/`** - Reusable logic (useApi, useAuth, useWebSocket, etc.)
- **`stores/`** - Pinia state management (useAuthStore)
- **`pages/`** - File-based routing
- **`types/`** - TypeScript interfaces
└── index.vue              → /
```

**Route dynamique:** `[id].vue` cree un parametre `$route.params.id`.

### `/app/middleware` - Route guards

3 middlewares de protection:

| Middleware | Role |
|------------|------|
| `auth.ts` | Protege les routes authentifiees, redirige vers `/auth/login` si non connecte |
| `guest.ts` | Empeche les utilisateurs connectes d'acceder aux pages d'auth |
| `moderator.ts` | Restreint l'acces aux moderateurs/admin uniquement |

**Utilisation dans une page:**
```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});
</script>
```

### `/app/layouts` - Layouts

2 layouts:

1. **`default.vue`** - Layout complet avec header, sidebar, footer, WebSocket
2. **`auth.vue`** - Layout minimal pour login/register (pas de navigation)

**Selection du layout:**
```vue
<script setup lang="ts">
definePageMeta({
  layout: 'auth'
});
</script>
```

Si non specifie, `default.vue` est utilise.

### `/app/plugins` - Plugins Nuxt

1 plugin:

- **`1.auth.ts`** - Initialise l'authentification au demarrage (coté client)

**Prefix numerique:** le `1.` force l'ordre l'execution en premier car nuxt les charge alphabetiquement (chiffres/numéro en premier).

**Pattern:**
```typescript
export default defineNuxtPlugin({
  name: 'auth-init',
  parallel: false,  // Bloquant
  async setup() {
    // Initialisation
  }
});
```

### `/app/config` - Configuration

2 fichiers de constantes:

- **`api.ts`** - Routes API backend (`API_ROUTES.USERS.LOGIN`, etc.)
- **`routes.ts`** - Routes frontend (`ROUTES.HOME`, `ROUTES.PROFILE`, etc.)

**Avantage:** Centralisation des URLs, pas de magic strings.

### `/app/types` - Types TypeScript

Types organises par domaine:

- `api.ts` - Types de reponses API
- `auth.ts` - Types d'authentification
- `tip.ts` - Types de tips
- `user.ts` - Types utilisateur
- `moderation.types.ts` - Types de moderation

**Convention:** Interfaces pour les objets, types pour les unions/aliases.

### `/app/utils` - Utilitaires

2 modules utilitaires:

- **`storage.ts`** - Wrapper localStorage SSR-safe
- **`navigation.ts`** - Helpers de navigation

**Pattern SSR-safe:**
```typescript
export const storage = {
  getAccessToken(): string | null {
    if (import.meta.server) return null;  // Guard SSR
    return localStorage.getItem('key');
  }
};
```

## Flux de donnees

### Pattern de communication

```
┌─────────────┐
│    Page     │
└──────┬──────┘
       │
       ├─→ Composable (useAuth, useApi)
       │        │
       │        ├─→ API Backend (HTTP)
       │        └─→ Store Pinia (si necessite etat global)
       │
       └─→ Composant enfant (props/events)
```

### Regles:

1. **Pages** appellent les composables pour la logique metier
2. **Composables** communiquent avec l'API et le store
3. **Composants** recoivent des props et emettent des events
4. **Store Pinia** uniquement pour etat partage entre plusieurs pages

## Patterns architecturaux

### 1. Composition API systematique

Tous les composants utilisent `<script setup>`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const count = ref(0);
const double = computed(() => count.value * 2);

function increment() {
  count.value++;
}
</script>
```


### 2. TypeScript strict

Tous les fichiers utilisent TypeScript avec mode strict:

- Parametres de fonctions types
- Retours de fonctions types
- Interfaces pour les objets complexes
- Generics pour les reponses API


### 3. Error handling centralise

Toutes les erreurs API sont gerees dans `useApi` composable:

- Retry automatique sur 401 avec refresh token
- Toast d'erreur automatique
- Logs en mode developpement

## Configuration Nuxt

Fichier `nuxt.config.ts`:

### Modules installes

```typescript
modules: [
  '@nuxt/eslint',        // Linting
  '@nuxt/image',         // Optimisation images
  '@nuxt/icon',          // Systeme d'icones
  '@nuxt/ui',            // Composants UI
  '@nuxtjs/color-mode',  // Dark mode
  '@nuxtjs/robots',      // Robots.txt
  '@nuxtjs/sitemap',     // Sitemap SEO
  '@pinia/nuxt',         // State management
]
```

### Runtime config

```typescript
runtimeConfig: {
  public: {
    apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL
  }
}
```

Accessible via `useRuntimeConfig().public.apiBaseUrl`.

### Auto-imports personnalises

```typescript
imports: {
  dirs: ['config', 'types', 'stores', 'composables', 'utils']
}
```

Tous les exports de ces dossiers sont auto-importes.

## Principes de conception

### 1. DRY (Don't Repeat Yourself)

Logique commune extraite en composables reutilisables.

### 2. Single Responsibility

Chaque composable/composant a une responsabilite unique et claire.

### 3. Type Safety

TypeScript strict pour eviter les erreurs a l'execution.

## Points forts de l'architecture

1. **Scalable** - Organisation claire par domaine
2. **Maintenable** - Separation des responsabilites
3. **Type-safe** - TypeScript strict partout
4. **Testable** - Logique extraite en composables purs
5. **Performant** - SSR, code splitting, optimisations automatiques
6. **Moderne** - Nuxt 4, Vue 3, Composition API

