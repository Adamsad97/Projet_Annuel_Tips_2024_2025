# Composables

Reusable logic functions with Composition API.

## Available Composables

- **`useApi`** - HTTP client (get, post, put, patch, delete)
- **`useAuth`** - Login, register, logout
- **`useWebSocket`** - Real-time events
- **`useGamification`** - XP, badges, leaderboard
- **`useToast`** - Notifications
- **`useSiteMeta`** - SEO meta tags

**Documentation complete:** [api.md](./api.md)

---

### 2. useAuth

**Fichier:** `app/composables/useAuth.ts`

**Responsabilite:** Operations d'authentification (login, register, logout, profile).

**Interface:**

```typescript
export function useAuth() {
  return {
    isAuthenticated: Ref<boolean>,
    user: Ref<User | null>,
    login: (credentials: LoginCredentials) => Promise<boolean>,
    register: (credentials: RegisterCredentials) => Promise<boolean>,
    logout: () => Promise<void>,
    getProfile: () => Promise<User | null>,
  };
}
```

**Utilisation:**

```vue
<script setup lang="ts">
const { login, isAuthenticated } = useAuth();
const success = await login({ email: '...', password: '...' });
</script>
```

**Fonctionnalites:**

- Login/Register avec validation
- Mise a jour automatique du store Pinia
- Toast de feedback utilisateur
- Gestion des erreurs
- Auto-login apres register


---

### 3. useWebSocket

**Fichier:** `app/composables/useWebSocket.ts`

**Responsabilite:** Connexion WebSocket et gestion d'evenements temps reel.

**Interface:**

```typescript
export function useWebSocket() {
  return {
    socket: Ref<Socket | null>,
    connected: Ref<boolean>,
    error: Ref<string | null>,
    connect: () => void,
    disconnect: () => void,
    onTipApproved: (callback: (data) => void) => void,
    onTipRejected: (callback: (data) => void) => void,
    onBadgeUnlocked: (callback: (data) => void) => void,
    off: (event: string) => void,
  };
}
```

**Utilisation:**

```vue
<script setup lang="ts">
const ws = useWebSocket();
ws.connect();
ws.onBadgeUnlocked((data) => { /* ... */ });
</script>
```

**Fonctionnalites:**

- Connexion Socket.io authentifiee
- Reconnexion automatique
- Events types (badge, tip approval)
- State reactif (connected, error)
- Deconnexion automatique au unmount

**Documentation complete:** [realtime.md](./realtime.md)

---

### 4. useGamification

**Fichier:** `app/composables/useGamification.ts`

**Responsabilite:** Recuperation des donnees de gamification (XP, badges, leaderboard).

**Interface:**

```typescript
export function useGamification() {
  return {
    progress: Ref<UserProgress | null>,
    badges: Ref<Badge[]>,
    leaderboard: Ref<LeaderboardUser[]>,
    loading: Ref<boolean>,
    error: Ref<string | null>,

    getCurrentLevel: ComputedRef<string>,
    earnedBadges: ComputedRef<Badge[]>,
    unearnedBadges: ComputedRef<Badge[]>,
    totalBadges: ComputedRef<number>,
    gradeProgress: ComputedRef<number>,

    fetchProgress: () => Promise<void>,
    fetchBadges: () => Promise<void>,
    fetchLeaderboard: (limit?: number, skip?: number) => Promise<void>,
    refreshAll: () => Promise<void>,
  };
}
```

**Utilisation:**

```vue
<script setup lang="ts">
const { progress, badges, fetchProgress } = useGamification();
await fetchProgress();
</script>
```


**Fonctionnalites:**

- Recuperation progression XP
- Liste des badges
- Classement des utilisateurs
- Computed helpers (earnedBadges, gradeProgress)
- Fonction `refreshAll` pour tout rafraichir

---

### 5. useToast

**Fichier:** `app/composables/useToast.ts`

**Responsabilite:** Systeme de notifications toast.

**Interface:**

```typescript
export function useToastMessage() {
  return {
    success: (message: string, title?: string) => void,
    error: (message: string, title?: string) => void,
    warning: (message: string, title?: string) => void,
    info: (message: string, title?: string) => void,
    apiError: (err: unknown, defaultTitle?: string) => void,
  };
}
```

**Utilisation:**

```typescript
const toast = useToastMessage();
toast.success('Operation reussie!');
toast.error('Erreur');
toast.apiError(error);
```

**Fonctionnalites:**

- 4 types de notifications (success, error, warning, info)
- Fonction `apiError` qui formate intelligemment les erreurs API
- Support des details de validation
- Affichage automatique avec duree configurable
- Style adapte au dark mode


---

### 6. useTokenRefresh

**Fichier:** `app/composables/useTokenRefresh.ts`

**Responsabilite:** Refresh automatique du JWT expire.

**Interface:**

```typescript
export function useTokenRefresh() {
  return {
    refreshAccessToken: () => Promise<boolean>,
  };
}
```

Utilise automatiquement par `useApi` lors d'une erreur 401 pour rafraichir le token.

---

### 7. useSiteMeta

**Fichier:** `app/composables/useSiteMeta.ts`

**Responsabilite:** Configuration des meta tags SEO.

**Interface:**

```typescript
export function useSiteMeta() {
  // Configure automatiquement les meta tags
  // Pas de retour, juste side-effects
}
```

Configure les meta tags SEO (title, description, og:image).

---

