# API Communication

## useApi Composable

Central HTTP client in `app/composables/useApi.ts`

```typescript
const api = useApi();
const user = await api.get<User>('/users/profile');
await api.post<LoginResponse>('/users/login', credentials, { skipAuth: true });
```

## Token Management

JWT auto-injected in headers. Auto-refresh on 401.
       ↓
2. Appel /auth/refresh avec refresh token
       ↓
3a. Refresh reussi → Nouveau token → Retry requete initiale
       ↓
3b. Refresh echoue → clearAuth() → Redirect /auth/login
```

Code:


**Important:** Le flag `retry` empeche les boucles infinies de refresh.

## Format des reponses API

### Structure standard

Toutes les reponses du backend suivent ce format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
```

### Extraction des donnees

Le composable `useApi` extrait automatiquement `data`:

```typescript
if (response.success && response.data !== undefined) {
  return response.data;  // ← Retourne directement les donnees
}

if (response.success) {
  return response as unknown as T;  // ← Pas de data, retourne response
}

throw new Error(response.message || 'erreur serveur');
```

Resultat: Les fonctions retournent directement les donnees typees, pas l'enveloppe `ApiResponse`.

## Gestion des erreurs

### Types d'erreurs

```typescript
interface FetchError {
  statusCode?: number;      // Code HTTP (401, 404, 500, etc.)
  message?: string;         // Message d'erreur brut
  data?: {
    message?: string;       // Message backend
    details?: Array<{       // Erreurs de validation
      path: string;
      message: string;
    }>;
  };
}
```

### Toast automatique

Par defaut, toutes les erreurs affichent un toast:

```typescript
if (options.showErrorToast !== false) {
  toast.apiError(fetchError);
}
```

Le composable `useToast` formate intelligemment les erreurs:

```typescript
function apiError(err: unknown) {
  let message = 'unexpected error';

  if (err && typeof err === 'object') {
    const apiErr = err as ApiErrorResponse;

    // Priorite aux details de validation
    if (apiErr.details?.length > 0) {
      message = apiErr.details
        .map(e => `${e.path}: ${e.message}`)
        .join(', ');
    }
    // Sinon message general
    else if (apiErr.message) {
      message = apiErr.message;
    }
  }

  toast.addToast({ type: 'error', message });
}
```

### Gestion manuelle

```typescript
try {
  const user = await api.get<User>('/users/profile');
} catch (error) {
  // Le toast est deja affiche
  // Logique supplementaire si besoin
  console.error('Erreur profile:', error);
}
```

## Configuration des endpoints

Fichier: `app/config/api.ts`

```typescript
export const API_ROUTES = {
  PING: '/ping',

  AUTH: {
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },

  USERS: {
    REGISTER: '/users/register',
    LOGIN: '/users/login',
    PROFILE: '/users/profile',
  },

  TIPS: {
    LIST: '/tips',
    DETAIL: (id: number) => `/tips/${id}`,
    CREATE: '/tips',
    UPDATE: (id: number) => `/tips/${id}`,
    DELETE: (id: number) => `/tips/${id}`,
  },
} as const;
```

**Avantages:**

- Centralisation des URLs
- Auto-completion TypeScript
- Refactoring facilite
- Pas de magic strings

**Utilisation:**

```typescript
const api = useApi();
await api.get<User>(API_ROUTES.USERS.PROFILE);
await api.get<Tip>(API_ROUTES.TIPS.DETAIL(123));
```

## Base URL

La base URL du backend est configuree via variable d'environnement:

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

Accessible dans le code via:

```typescript
const config = useRuntimeConfig();
const baseURL = config.public.apiBaseUrl;
```

Le composable `useApi` l'utilise automatiquement:

```typescript
const response = await $fetch<ApiResponse<T>>(endpoint, {
  baseURL,  // ← Injecte automatiquement
  method: options.method || 'GET',
  body: options.body,
  headers,
});
```

## Client HTTP sous-jacent

`useApi` utilise `$fetch` de Nuxt, qui est base sur `ofetch`:

- Compatible SSR et client
- Gestion automatique des cookies
- Support des streams
- Type-safe

## Composables metier

Les composables encapsulent les appels API: `useAuth`, `useGamification`, etc.

## Refresh token

Composable dedie: `app/composables/useTokenRefresh.ts`

Utilise automatiquement par `useApi` lors d'une erreur 401.

## Logs de debug

En mode developpement, tous les appels API sont loggues (facilite le debugging).

## Securite

### Protection CSRF

Non necessaire car:

1. JWT dans headers (pas de cookies auto-envoyes)
2. API REST stateless
3. SameSite policy moderne

### XSS Prevention

1. Vue.js echappe automatiquement les donnees dans les templates
2. Pas de `v-html` avec donnees utilisateur
3. Sanitization cote backend

### Headers de securite

Configures cote backend:

- CORS strict
- Rate limiting
- Content-Type validation

