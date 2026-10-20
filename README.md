# AideFlash - Plateforme de partage de tips

Application web communautaire pour partager des astuces, poser des questions et trouver rapidement une réponse fiable. Les utilisateurs gagnent de l'XP, des badges et des grades selon leur activité, et les contenus sont validés par des modérateurs.

Repository : https://github.com/Froggys974/projet-annuel-4IWJ-tips

## Stack

- **Frontend** : Nuxt 4, Vue 3, TypeScript, Pinia, Tailwind CSS 4, Leaflet (carte), Socket.io client
- **Backend** : Node.js 24, Express 5, TypeScript, Prisma 7, PostgreSQL 16, JWT, Zod, Socket.io, Jest + Supertest
- **Infra** : Docker Compose (PostgreSQL, backend, Adminer), GitHub Actions (tests, lint, format)

## Lancer le projet

Prérequis : Node.js 20+, npm 10+, Docker Desktop lancé.

```bash
# 1. Cloner
git clone https://github.com/Froggys974/projet-annuel-4IWJ-tips.git
cd projet-annuel-4IWJ-tips

# 2. Variables d'environnement
cp backend/.env.sample backend/.env
cp frontend/.env.example frontend/.env

# 3. Dépendances (frontend + backend, utile aussi pour l'auto-complétion Prisma dans l'IDE)
npm run install:all
npm run backend:fix-IDE

# 4. Backend + base de données dans Docker (build, démarrage, schéma Prisma, données de test)
npm run docker:dev

# 5. Frontend en local (dans un second terminal)
cd frontend
npm run dev
```

Le premier démarrage du frontend peut prendre 1 à 2 minutes.

Les fois suivantes : `npm run docker:up` puis `cd frontend && npm run dev`.

### Après un `git pull`

Si le schéma Prisma (`backend/prisma/schema/`) a changé, appliquer les changements à la base :

```bash
npm run db:push
```

Si de nouvelles dépendances ont été ajoutées : `npm run install:all` puis `npm run docker:rebuild`.

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001/api |
| Health check | http://localhost:3001/api/ping |
| Adminer (BDD) | http://localhost:8080 (serveur `postgres`, identifiants dans `backend/.env`) |

### Comptes de test

Créés par les seeds (`npm run db:seed`) :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@tipstop.com | Admin123! |
| Modérateur | moderator@tipstop.com | Modo123! |
| Utilisateur | alice@example.com | Alice123! |
| Utilisateur | bob@example.com | Bob123! |
| Utilisateur | charlie@example.com | Charlie123! |

Le compte admin donne accès à l'espace d'administration (`/admin`), le compte modérateur à la file de modération (`/moderation`).

## Scripts utiles

À lancer depuis la racine :

```bash
npm run docker:up          # Démarrer les conteneurs
npm run docker:down        # Arrêter les conteneurs
npm run docker:logs        # Logs de tous les services
npm run docker:rebuild     # Rebuild de l'image backend

npm run db:push            # Appliquer le schéma Prisma à la base
npm run db:seed            # Ajouter les données de test
npm run db:reset           # Redémarrer, appliquer le schéma et reseeder

npm run backend:test       # Tests backend (sur la base de test postgres-test)
npm run lint               # Lint backend + frontend
npm run format             # Prettier backend + frontend
```

Les tests backend utilisent la base `postgres-test` et jamais la base de développement. Plus de détails dans [backend/doc/tests.md](./backend/doc/tests.md).

## Problèmes courants

- **Le backend ne démarre pas** : vérifier que Docker est lancé, puis `npm run docker:logs` et `npm run db:push`.
- **Erreurs API dans le frontend** : vérifier http://localhost:3001/api/ping, `NUXT_PUBLIC_API_BASE_URL` dans `frontend/.env` et `CORS_ORIGIN` dans `backend/.env`.
- **Erreurs TypeScript / Prisma dans l'IDE** : `npm run backend:fix-IDE` puis recharger l'IDE.
- **Colonne ou table manquante** : le schéma a changé, lancer `npm run db:push`.

## Documentation

- Backend : [routes API](./backend/doc/api.md), [architecture](./backend/doc/architecture.md), [variables d'environnement](./backend/doc/env.md), [tests](./backend/doc/tests.md), [seeds](./backend/doc/seeds.md)
- Frontend : [architecture](./frontend/doc/architecture.md), [appels API](./frontend/doc/api.md), [temps réel](./frontend/doc/realtime.md), [carte](./frontend/doc/maps.md)
- Produit : [maquettes Figma](https://www.figma.com/design/QX9DWUx99H75nFnZq1o1uW/AideFlash?node-id=0-1&p=f), [cahier des charges](docs/Projet%20TipsTop_.pdf)

## Auteurs

GRONDIN Florent, VANDERLYNDEN Louis-Martin, DIAWARA Adama
