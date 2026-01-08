# Real-time Communication with WebSocket

## useWebSocket Composable (fonctionnel sur la page d'acceuil)

Pour tester le composable `useWebSocket`, 
- créer un tips.
- aller sur la page d'acceuil.
- Ouvrir une autre fenetre navigateur privée (attention pas deux navigateur privée du meme compte. Ex: Chrome et Firefox ou Compte chrome 1 + nav privée depuis le compte chrome 1) et se connecter en tant que moderateur.
- Approuver le tips crée vié l'onglet moderation (tips en bas de la liste).
- Observer sur la page d'acceuil l'apparition du tips en temps réel.

Location: `app/composables/useWebSocket.ts`

```typescript
const ws = useWebSocket();
ws.connect();
ws.onBadgeUnlocked((data) => {
  console.log('Badge unlocked:', data.badge.name);
});
```

## Events

- `tip:approved` - Tip was approved
- `tip:rejected` - Tip was rejected
- `badge:unlocked` - Badge awarded

```typescript
const connect = () => {
  const config = useRuntimeConfig();
  const backendUrl = config.public.backendUrl || 'http://localhost:3001';
  const token = storage.getAccessToken();

  socket.value = io(backendUrl, {
    transports: ['websocket', 'polling'],  // ← Fallback sur polling si WS echoue
    reconnection: true,                    // ← Reconnexion auto
    reconnectionDelay: 1000,               // ← Delai initial: 1s
    reconnectionDelayMax: 5000,            // ← Delai max: 5s
    reconnectionAttempts: 5,               // ← Max 5 tentatives
    auth: {
      token: token,                        // ← JWT pour authentification
    },
  });

  // Event handlers
  socket.value.on('connect', () => {
    connected.value = true;
    error.value = null;
    console.log('[WebSocket] Connected');
  });

  socket.value.on('disconnect', () => {
    connected.value = false;
    console.log('[WebSocket] Disconnected');
  });

  socket.value.on('connect_error', (err) => {
    error.value = err.message;
    console.error('[WebSocket] Error:', err.message);
  });
};
```


## Integration dans le layout

Fichier: `app/layouts/default.vue`

### Initialisation

```vue
<script setup lang="ts">
const ws = useWebSocket();
const { user } = useAuth();

onMounted(() => {
  if (user.value) {
    console.log('[Layout] Connecting WebSocket for user:', user.value.id);
    ws.connect();

    ws.onBadgeUnlocked((data) => {
      if (data.userId === user.value?.id) {
        unlockedBadge.value = data.badge;
        showBadgeModal.value = true;
      }
    });
  } else {
    console.log('[Layout] No user authenticated, WebSocket not connected');
  }
});
</script>
```

**Logique:**

1. Verifie que l'utilisateur est connecte
2. Si oui, etablit la connexion WebSocket
3. Ecoute l'event `badge:unlocked`
4. Affiche la modal si le badge est pour l'utilisateur actuel

**Guard userId:** Important pour ne pas afficher les badges d'autres utilisateurs.

### Modal de badge

```vue
<script setup lang="ts">
const showBadgeModal = ref(false);
const unlockedBadge = ref<{
  id: number;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
} | null>(null);

const closeBadgeModal = () => {
  showBadgeModal.value = false;
  setTimeout(() => {
    unlockedBadge.value = null;
  }, 300); // Attendre la fin de l'animation
};
</script>

<template>
  <BadgeUnlockModal
    :badge="unlockedBadge"
    :show="showBadgeModal"
    @close="closeBadgeModal"
  />
</template>
```

## Deconnexion

### Automatique au unmount

```typescript
onUnmounted(() => {
  disconnect();
});
```

Le composable `useWebSocket` deconnecte automatiquement le socket lorsque le composant est demonte.

### Manuelle

```typescript
const disconnect = () => {
  if (socket.value) {
    socket.value.disconnect();
    socket.value = null;
    connected.value = false;
  }
};
```