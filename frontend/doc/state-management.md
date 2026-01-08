# State Management with Pinia

## Store: useAuthStore

Location: `app/stores/auth.ts`

Manages:
- `user` - Current user data (null if not logged in)
- `isAuthenticated` - Computed boolean
- `setAuth()` - Save user + tokens
- `clearAuth()` - Logout

Indique si l'initialisation de l'auth a ete effectuee.

**Usage:** Affiche un loader global tant que `false`.

### `isLoading: boolean`

Indique si une operation d'auth est en cours.

## Getters (proprietes calculees)

### `isAuthenticated: boolean`

```typescript
const isAuthenticated = computed(() => user.value !== null);
```

Simplifie la verification d'authentification dans toute l'application.

### `currentUser: User | null`

```typescript
const currentUser = computed(() => user.value);
```

Alias reactif pour acceder a l'utilisateur courant.

## Actions (methodes)

### `setAuth(data: LoginResponse)`

Enregistre les donnees d'authentification apres login/register:

```typescript
function setAuth(data: LoginResponse) {
  user.value = data.user;
  storage.setAccessToken(data.accessToken);
  storage.setRefreshToken(data.refreshToken);
  storage.setUser(data.user);
}
```

**Appele par:** `useAuth` composable apres login/register reussi.

### `setUser(userData: User)`

Met a jour les informations utilisateur:

```typescript
function setUser(userData: User) {
  user.value = userData;
  storage.setUser(userData);
}
```

**Usage:** Apres mise a jour du profil ou refresh des donnees.

### `clearAuth()`

Deconnecte l'utilisateur et nettoie toutes les donnees:

```typescript
function clearAuth() {
  user.value = null;
  storage.clearAuth();
}
```

**Appele par:**
- Logout utilisateur
- Token expire et refresh impossible
- Erreur 401 non recuperable

### `initializeAuth()` (async)

Initialise l'authentification au demarrage:
1. Charge utilisateur depuis localStorage
2. Tente de rafraichir depuis API
3. Mode degrade si echec (garde cache)

Appele par plugin `1.auth.ts` (client-side).

## Utilisation

```vue
<script setup lang="ts">
const authStore = useAuthStore();
const { isAuthenticated, currentUser } = storeToRefs(authStore);
</script>
```

Auto-import Nuxt, pas besoin d'import explicite.

## Persistance

Geree manuellement via `localStorage` (module `app/utils/storage.ts`):
- Controle total, SSR-safe
- Pas de plugin tiers necessaire
