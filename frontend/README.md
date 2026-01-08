# Documentation Frontend - AideFlash
Repository: https://github.com/Froggys974/projet-annuel-4IWJ-tips

## Vue d'ensemble

AideFlash est une plateforme communautaire de partage d'astuces et conseils pratiques. Le frontend est une application web moderne construite avec Nuxt 4 et Vue 3.

## Technologies principales

- **Nuxt 4** - Framework Vue.js
- **Vue 3**
- **TypeScript 5**
- **Pinia** - Gestion d'état officielle Vue
- **Tailwind CSS 4** - Framework CSS utility-first
- **Socket.io Client** - Communication temps reel WebSocket
- **Leaflet** - Cartes interactives
- **@nuxt/ui** - Bibliotheque de composants UI

## Fonctionnalites cles

### Authentification JWT
- Inscription et connexion utilisateur
- Refresh token automatique
- Middleware de protection des routes
- Persistance de session avec localStorage

### Gamification
- Systeme XP et grades
- Systeme de badges avec notifications temps reel
- Classement des utilisateurs (leaderboard)
- Barre de progression visuelle

### Tips (astuces)
- Creation, edition, suppression de tips
- Systeme de votes et commentaires
- Galerie d'images
- Geolocalisation sur carte interactive
- Moderation par les moderateurs

### Temps reel
- Notifications de badge debloque via WebSocket
- Approbation/rejet de tips en direct
- Mise a jour dynamique du contenu

### SEO et Performance
- Server-Side Rendering (SSR)
- Sitemap.xml dynamique
- Robots.txt configurable
- Meta tags optimises
- Lazy loading et code splitting automatique
- Optimisation d'images avec @nuxt/image

## Structure de la documentation

1. [architecture.md](./doc/architecture.md) - Architecture du projet
2. [state-management.md](./doc/state-management.md) - Gestion d'etat avec Pinia
3. [api.md](./doc/api.md) - Communication avec le backend
4. [realtime.md](./doc/realtime.md) - WebSocket et temps reel
5. [maps.md](./doc/maps.md) - Integration Leaflet
6. [composables.md](./doc/composables.md) - Logique metier reutilisable
7. [run-project.md](./doc/run-project.md) - Lancer le projet en local

## Arborescence simplifiee

```
frontend/
├── app/                    # Code source principal
│   ├── components/         # Composants Vue
│   ├── composables/        # Logique reutilisable
│   ├── config/             # Configuration (routes, API)
│   ├── layouts/            # Layouts globaux
│   ├── middleware/         # Route guards
│   ├── pages/              # File-based routing
│   ├── plugins/            # Plugins Nuxt
│   ├── stores/             # Stores Pinia
│   ├── types/              # Types TypeScript
│   └── utils/              # Utilitaires
├── public/                 # Assets statiques
├── server/                 # Server-side API routes
├── doc/                    # Documentation (ce dossier)
├── nuxt.config.ts          # Configuration Nuxt
├── package.json            # Dependances
└── tsconfig.json           # Configuration TypeScript
```

## Conventions de code

### Naming
- Composants: PascalCase (`AppHeader.vue`)
- Composables: camelCase avec prefix `use` (`useAuth.ts`)
- Types: PascalCase (`User`, `LoginResponse`)
- Constantes: UPPER_SNAKE_CASE (`API_ROUTES`)

### TypeScript
- Mode strict active
- Typage explicite des parametres et retours de fonction
- Interfaces pour les objets complexes
- Types generiques pour les reponses API

### Style
- Tailwind CSS uniquement (pas de CSS manuel)
- Dark mode supporte via `@nuxtjs/color-mode`
- Mobile-first responsive design

## Environnement

### Variables d'environnement

Fichier `.env` a la racine:

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NUXT_PUBLIC_SITE_ENV=development
```

### Ports par defaut

- Frontend dev: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- WebSocket: `http://localhost:3001`

## Qualite de code

- **ESLint** avec config Nuxt officielle
- **Prettier** pour le formatage
- **TypeScript strict mode**

## Deploiement

Le projet inclut un Dockerfile multi-stage pour production:

1. Build stage: compilation Nuxt
2. Production stage: serveur Nginx + Node

Configuration Nginx fournie à la racine `/nginx/default.conf`.

## Liens utiles

- [Nuxt 4 Documentation](https://nuxt.com)
- [Vue 3 Documentation](https://vuejs.org)
- [Pinia Documentation](https://pinia.vuejs.org)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## Auteurs

GRONDIN Florent, VANDERLYNDEN Louis-Martin