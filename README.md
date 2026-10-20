# AideFlash - Plateforme de partage de tips

Application web communautaire pour partager des astuces, poser des questions et trouver rapidement une réponse fiable. Les utilisateurs gagnent de l'XP, des badges et des grades selon leur activité, et les contenus sont validés par des modérateurs.

Repository : https://github.com/Froggys974/projet-annuel-4IWJ-tips

## Stack

- **Frontend** : Nuxt 4, Vue 3, TypeScript, Pinia, Tailwind CSS 4, Leaflet (carte), Socket.io client
- **Backend** : Node.js 24, Express 5, TypeScript, Prisma 7, PostgreSQL 16, JWT, Zod, Socket.io, Jest + Supertest
- **Infra** : Docker Compose (PostgreSQL, backend, Adminer), GitHub Actions (tests, lint, types, build et démarrage des images de production, à chaque push sur `develop` et `main`)

## Lancer et tester le projet

Prérequis : Node.js 20+, npm 10+, Docker Desktop **lancé**. Les commandes fonctionnent dans un terminal Bash comme dans PowerShell.

**Étape 1 : récupérer le projet**

```bash
git clone https://github.com/Froggys974/projet-annuel-4IWJ-tips.git
cd projet-annuel-4IWJ-tips
```

**Étape 2 : créer les fichiers de configuration**

```bash
cp backend/.env.sample backend/.env
cp frontend/.env.example frontend/.env
```

Les valeurs par défaut conviennent pour le développement, rien à modifier.

**Étape 3 : installer les dépendances**

```bash
npm run install:all
npm run backend:fix-IDE
```

**Étape 4 : démarrer la base de données et l'API (Docker)**

```bash
npm run docker:dev
```

Construit l'image, démarre PostgreSQL, l'API et Adminer, applique les migrations et crée les données de test. Attendre le message `seeding complete`.

**Étape 5 : démarrer le site (dans un second terminal, depuis la racine du projet)**

```bash
cd frontend
npm run dev
```

Le premier démarrage peut prendre 1 à 2 minutes. Attendre la ligne `Local: http://localhost:3000/`.

**Étape 6 : ouvrir le site**

Ouvrir http://localhost:3000 et se connecter avec un des [comptes de test](#comptes-de-test).

**Étape 7 : parcours de test conseillé**

1. **Visiteur** (sans connexion) : accueil, liste des tips (seul le début du contenu est visible), carte, page « À propos » (statistiques réelles).
2. **alice@example.com** : publier un tip (« Partager un Tip »), il apparaît « En attente » dans « Mes tips ».
3. **moderator@tipstop.com** (autre navigateur ou navigation privée) : page « Modération », valider le tip. Alice reçoit une notification en temps réel.
4. **Interactions** (alice ou bob) : commenter, voter, signaler, suivre un membre depuis son profil, envoyer un message privé.
5. **charlie@example.com** (15 XP) : publier un tip est bloqué tant qu'il n'a pas 20 XP, il peut seulement poser une question.
6. **Profil et paramètres** : XP, grade et badges ; modifier son profil, activer la double authentification (2FA).
7. **admin@tipstop.com** : page « Administration » (utilisateurs et sanctions, indice de confiance, contestations, messages de contact, badges et grades, chatbot, publicité, fonctionnalités A/B, logs).

**Étape 8 : lancer les tests automatisés (Docker toujours démarré)**

```bash
npm run backend:test
npm run lint
```

`backend:test` utilise une base dédiée (`postgres-test`) et ne touche pas aux données de l'étape 4.

**Étape 9 : arrêter le projet**

`Ctrl + C` dans le terminal du site, puis :

```bash
npm run docker:down
```

Pour relancer plus tard : `npm run docker:up`, puis `cd frontend` et `npm run dev`.

### Après un `git pull`

Appliquer les nouvelles migrations de base de données (sans effet s'il n'y en a pas) :

```bash
npm run db:migrate
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

Le compte admin donne accès à l'espace d'administration (`/admin`) : utilisateurs, indice de confiance, messages de contact, chatbot, publicité (tips et défis sponsorisés), fonctionnalités expérimentales (A/B) et logs d'erreurs. Le compte modérateur donne accès à la file de modération (`/moderation`).
Charlie (15 XP) ne peut encore que poser des questions : publier un tip demande 20 XP. Un compte tout juste créé est dans le même cas.

## Lancer la version de production (Docker)

Toute l'application (PostgreSQL, API, site, nginx) tourne dans Docker, derrière nginx sur le port **80** (qui doit être libre). Elle démarre sans données de démonstration, comme une vraie installation.

**Étape 1 : créer le fichier de configuration de production (non versionné)**

```bash
cp backend/.env.sample backend/.env.production
```

**Étape 2 : générer deux secrets aléatoires**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Étape 3 : modifier `backend/.env.production`**

- `NODE_ENV=production`
- `JWT_SECRET=` le premier secret, `REFRESH_SECRET=` le second.

Garder les autres lignes. L'API refuse de démarrer en production avec les secrets d'exemple (`change_me…`).

**Étape 4 : construire et démarrer**

```bash
docker compose -f docker-compose.prod.yaml up -d --build
```

Au démarrage, l'API applique les migrations, données de référence comprises (grades, badges, catégories, chatbot).

**Étape 5 : créer le premier administrateur**

S'inscrire sur http://localhost, puis donner le rôle administrateur à ce compte :

```bash
docker exec backend-prod npm run admin:promote -- email@du-compte.fr
```

Se déconnecter puis se reconnecter : le menu « Administration » apparaît.

**Étape 6 : arrêter**

```bash
docker compose -f docker-compose.prod.yaml down
```

Sur un vrai serveur, indiquer l'adresse publique du site (liens canoniques, sitemap) avant l'étape 4 : `SITE_URL=https://mon-domaine.fr` dans le terminal (PowerShell : `$env:SITE_URL="https://mon-domaine.fr"`).

## Scripts utiles

À lancer depuis la racine :

```bash
npm run docker:up          # Démarrer les conteneurs
npm run docker:down        # Arrêter les conteneurs
npm run docker:logs        # Logs de tous les services
npm run docker:rebuild     # Rebuild de l'image backend

npm run db:migrate         # Appliquer les migrations en attente
npm run db:migrate:status  # Voir les migrations appliquées / en attente
npm run db:seed            # Ajouter les données de test (relançable sans doublon)

npm run backend:test       # Tests backend (sur la base de test postgres-test)
npm run lint               # Lint backend + frontend
npm run format             # Prettier backend + frontend
```

Les tests backend utilisent la base `postgres-test` et jamais la base de développement. Plus de détails dans [backend/doc/tests.md](./backend/doc/tests.md).

## Modifier le schéma de la base

Le schéma est versionné avec des **migrations Prisma** (`backend/prisma/migrations/`), qui sont commitées avec le code.

1. Modifier les fichiers de `backend/prisma/schema/`.
2. Générer la migration et l'appliquer à votre base :

   ```bash
   npm run db:migrate:dev -- --name ajout_champ_xxx
   ```

3. Relire le SQL généré dans `backend/prisma/migrations/<date>_ajout_champ_xxx/`, puis le commiter avec le code.

La CI applique toutes les migrations sur une base neuve : une migration oubliée ou cassée fait échouer la CI. `prisma db push` n'est plus utilisé, car il peut supprimer des données sans prévenir.

**Base créée avant le passage aux migrations** (avec `db push`) : à faire une seule fois, sans perte de données :

```bash
npm run db:baseline
```

Ou, si les données locales n'ont pas d'importance : `npm run docker:clean` puis `npm run docker:dev`.

## Problèmes courants

- **Le backend ne démarre pas** : vérifier que Docker est lancé, puis `npm run docker:logs` et `npm run db:migrate`.
- **Erreurs API dans le frontend** : vérifier http://localhost:3001/api/ping, `NUXT_PUBLIC_API_BASE_URL` dans `frontend/.env` et `CORS_ORIGIN` dans `backend/.env`.
- **Erreurs TypeScript / Prisma dans l'IDE** : `npm run backend:fix-IDE` puis recharger l'IDE.
- **Colonne ou table manquante** : des migrations sont en attente, lancer `npm run db:migrate`.
- **`migrate deploy` refuse de s'appliquer (P3005, base non vide)** : la base a été créée avec `db push`, lancer une fois `npm run db:baseline`.

## Documentation

- Backend : [routes API](./backend/doc/api.md), [architecture](./backend/doc/architecture.md), [variables d'environnement](./backend/doc/env.md), [tests](./backend/doc/tests.md), [seeds](./backend/doc/seeds.md)
- Frontend : [architecture](./frontend/doc/architecture.md), [appels API](./frontend/doc/api.md), [temps réel](./frontend/doc/realtime.md), [carte](./frontend/doc/maps.md)
- Produit : [maquettes Figma](https://www.figma.com/design/QX9DWUx99H75nFnZq1o1uW/AideFlash?node-id=0-1&p=f), [cahier des charges](docs/Projet%20TipsTop_.pdf)

## Auteurs

GRONDIN Florent, VANDERLYNDEN Louis-Martin, DIAWARA Adama
