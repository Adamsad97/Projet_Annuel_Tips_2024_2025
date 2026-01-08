# AideFlash - Plateforme de partage de tips
Repository: https://github.com/Froggys974/projet-annuel-4IWJ-tips

## Presentation du projet

AideFlash est une application web fullstack permettant aux utilisateurs de partager et decouvrir des astuces et conseils pratiques.

### Fonctionnalites principales

- Authentification securisee avec JWT
- Creation et gestion de tips avec validation
- Systeme de gamification (XP, badges, grades)
- Moderation de contenu par moderateurs
- Classement des utilisateurs
- Notifications temps reel via WebSocket
- Cartographie interactive avec Leaflet
- Systeme de commentaires et votes

### Architecture

**Frontend:** Application web reactive qui affiche l'interface utilisateur et communique avec le backend via API REST et WebSocket.

**Backend:** API REST qui gere la logique metier, l'authentification, la base de donnees et les notifications temps reel.

## Technologies utilisees

### Frontend

- Nuxt 4
- Vue 3
- TypeScript 5
- Pinia (pour la gestion d'etat)
- Tailwind CSS 4 + Nuxt UI (pour l'interface et l'UX/UI)
- Leaflet (pour le module de cartographie basé sur OpenStreetMap)
- Socket.io Client (temps reel sur l'affichage des tips)

### Backend

- Node.js 24 + Express 5
- TypeScript 5
- PostgreSQL 15
- Prisma 7
- JWT 
- Zod (validation des formulaires)
- Socket.io (WebSocket)
- Jest + Supertest (tests unitaires et integration)

### Conteneurisation

- Docker
- Docker Compose

## Integration continue (CI)

GitHub Actions avec 3 jobs executes sur push/PR :
- **test** : lance la suite de tests
- **lint** : verifie le linting
- **format** : verifie le formatage Prettier
![Image Intégration continu](docs/image.png)

## Design et vision produit

- **Figma** : maquettes disponibles ici → https://www.figma.com/design/QX9DWUx99H75nFnZq1o1uW/AideFlash?node-id=0-1&p=f
![figma](docs/image.png)
- **GitHub Projects** : tableau de suivi ![screen githubproject](docs/image-1.png)
- **Use cases / spec PDF** : voir [docs/Projet TipsTop_.pdf](docs/Projet%20TipsTop_.pdf)

## Lancer le projet en developpement

### Prerequis

- Node.js 20+
- npm 10+
- Docker et Docker Compose
- Git

### Installation

#### 1. Si besoin: cloner le repository

```bash
git clone https://github.com/Froggys974/projet-annuel-4IWJ-tips.git
cd projet-annuel-4IWJ-tips
```

#### 2. Installer les dependances

```bash
npm run install:all
```

Cette commande installe les dependances du frontend et du backend.

#### 3. Generer le client Prisma (pour eviter les erreurs IDE sur le backend car lancé sur docker donc node_modules absents)

```bash
npm run backend:fix-IDE
```

Cette etape est necessaire pour:
- Generer le client Prisma TypeScript
- Supprimer les erreurs dans l'IDE (VS Code, etc.)
- Permettre l'auto-completion des models Prisma

#### 4. Configurer les variables d'environnement

Copier les fichiers d'exemple et les editer:

```bash
# Backend
cp backend/.env.sample backend/.env

# Frontend (deja present)
# frontend/.env existe deja
```

Voir la section "Variables d'environnement" ci-dessous.

#### 5. Lancer le projet avec Docker

```bash
npm run docker:dev
```

Cette commande:
- Build l'image Docker du backend
- Demarre PostgreSQL et le backend avec docker
- Execute les migrations Prisma dans le conteneur
- Peuple la base avec des donnees de test (seeds)

#### 6. Lancer le frontend

Dans un terminal separe:

```bash
cd frontend
npm run dev
```

Le premier lancement peut prendre 1-2 minutes (installation Nuxt, generation des types, etc.). C'est normal.

### URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Health check: http://localhost:3001/api/ping

### Comptes de test

Apres execution des seeds:

| Role | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@tipstop.com | Admin123! |
| Moderateur | moderator@tipstop.com | Modo123! |
| Utilisateur | alice@example.com | Alice123! |
| Utilisateur | bob@example.com | Bob123! |
| Utilisateur | charlie@example.com | Charlie123! |


### Scripts Docker disponibles

Depuis la racine du projet:

```bash
# Development complet (build + start + migrations + seeds)
npm run docker:dev

# Build uniquement
npm run docker:build

# Demarrer les services
npm run docker:up

# Arreter les services
npm run docker:down

# Redemarrer le backend
npm run docker:restart

# Voir les logs
npm run docker:logs           # Tous les services
npm run docker:logs:backend   # Backend uniquement
npm run docker:logs:postgres  # PostgreSQL uniquement

# Nettoyer (supprime les volumes)
npm run docker:clean

# Rebuild complet
npm run docker:rebuild

# Acces shell dans le conteneur backend
npm run backend:shell
```

### Le backend fonctionne dans Docker

Important: Le backend s'execute dans un conteneur Docker. Cela signifie:

- Les dependances backend sont isolees
- PostgreSQL est accessible seulement dans Docker et via adminer
- Les migrations Prisma s'executent dans le conteneur
- Les commandes `npm run db:*` interagissent avec le conteneur

Le frontend, lui, s'execute en local (hors Docker) pour faciliter le developpement avec hot reload.

## Adminer
Adminer est inclus pour gerer la base de donnees PostgreSQL.
URL: http://localhost:8080
- SGBD: PostgreSQL
- Serveur: postgres
- Utilisateur: 'voir backend/.env'
- Mot de passe: 'voir backend/.env'
- Base de donnees: 'voir backend/.env'

## Variables d'environnement

### Backend (.env)

Localisation: `backend/.env`

Copier depuis: `backend/.env.sample`

Variables requises:

```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

DATABASE_URL=postgresql://postgres:password@postgres:5432/tips_bd?schema=public

JWT_SECRET=votre_secret_jwt_tres_long_et_securise
REFRESH_SECRET=votre_secret_refresh_tres_long_et_securise

CORS_ORIGIN=http://localhost:3000
```

Notes:
- `DATABASE_URL` utilise `postgres` comme host (nom du service Docker)
- `JWT_SECRET` et `REFRESH_SECRET` doivent etre longs et uniques
- `CORS_ORIGIN` doit correspondre a l'URL du frontend

### Frontend (.env)

Localisation: `frontend/.env`

Deja present. Variables:

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NUXT_PUBLIC_SITE_ENV=development
```

Notes:
- `NUXT_PUBLIC_API_BASE_URL` doit pointer vers le backend
- Ne pas modifier sauf changement de port backend

## Structure du projet

```
projet-annuel-4IWJ-tips/
├── backend/              # API REST + WebSocket
│   ├── src/             # Code source TypeScript
│   ├── prisma/          # Schema base de donnees
│   ├── doc/             # Documentation backend
│   └── docker-compose.yml
│
├── frontend/            # Application Nuxt
│   ├── app/             # Code source application
│   ├── doc/             # Documentation frontend
│   └── public/          # Assets statiques
│
├── package.json         # Scripts projet global
└── README.md            # Ce fichier
```

## Documentation detaillee

### Backend

Documentation complete dans `backend/doc/`:

- [README.md](./backend/README.md) - Vue d'ensemble
- [run-project.md](./backend/doc/run-project.md) - Lancer le backend
- [architecture.md](./backend/doc/architecture.md) - Architecture et patterns
- [env.md](./backend/doc/env.md) - Variables d'environnement
- [tests.md](./backend/doc/tests.md) - Tests unitaires et integration
- [seeds.md](./backend/doc/seeds.md) - Donnees de test
- [api.md](./backend/doc/api.md) - Routes API

### Frontend

Documentation complete dans `frontend/doc/`:

- [README.md](./frontend/README.md) - Vue d'ensemble
- [run-project.md](./frontend/doc/run-project.md) - Lancer le frontend
- [architecture.md](./frontend/doc/architecture.md) - Architecture Nuxt 4
- [state-management.md](./frontend/doc/state-management.md) - Pinia
- [api.md](./frontend/doc/api.md) - Communication backend
- [realtime.md](./frontend/doc/realtime.md) - WebSocket
- [maps.md](./frontend/doc/maps.md) - Leaflet
- [composables.md](./frontend/doc/composables.md) - Logique metier

## Scripts utiles

### Projet global

```bash
npm run install:all      # Installer toutes les dependances
npm run dev              # Lancer backend (Docker) + frontend
npm run docker:dev       # lance docker backend complet + bdd (build, start, migrations, seeds)
npm run lint             # lint backend + frontend
npm run format           # format backend + frontend
```

### Base de donnees

```bash
npm run db:push          # Appliquer le schema Prisma
npm run db:generate      # Generer le client Prisma
npm run db:seed          # Peupler avec donnees de test
npm run db:reset         # Reset complet (down, up, push, seed)
```

### Backend

```bash
cd backend
npm run dev             
npm run format
```

### Frontend

```bash
cd frontend
npm run dev
npm run format
```

## Problemes courants

### Le backend ne demarre pas

1. Verifier que Docker est lance
2. Verifier que PostgreSQL est healthy: `npm run docker:logs:postgres`
3. Regenerer le client Prisma: `cd backend && npx prisma generate`
4. Executer les migrations: `npm run db:push`

### Le frontend affiche des erreurs API

1. Verifier que le backend est lance: http://localhost:3001/api/ping
2. Verifier `NUXT_PUBLIC_API_BASE_URL` dans `frontend/.env`
3. Verifier `CORS_ORIGIN` dans `backend/.env`

### Erreurs TypeScript dans l'IDE

1. Executer `cd backend && npx prisma generate`
2. Executer `npm run install:all`
3. Redemarrer l'IDE (VS Code: Reload Window)

### Le frontend prend du temps a demarrer

Le premier lancement Nuxt peut prendre 1-2 minutes. C'est normal.

Nuxt genere les types, compile Tailwind CSS et prepare le serveur de dev.

Les demarrages suivants sont plus rapides.

## Tests

### Backend

```bash
cd backend

# Tous les tests
npm test

# Tests unitaires uniquement
npm test -- --testPathPattern=unit

# Tests integration uniquement
npm test -- --testPathPattern=integration

# Avec couverture
npm test -- --coverage

# Mode watch
npm run test:watch
```


Voir [backend/doc/tests.md](./backend/doc/tests.md) pour plus de details.

## Auteurs

GRONDIN Florent, VANDERLYNDEN Louis-Martin

## Licence

ISC
