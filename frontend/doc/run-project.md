# Lancer le projet en local

## Prerequisites

### Logiciels requis

- **Node.js 20+** - Runtime JavaScript
- **npm 10+** - Gestionnaire de paquets (fourni avec Node.js)
- **Git** - Controle de version

### Verification des versions

```bash
node --version
# v20.x.x ou superieur

npm --version
# 10.x.x ou superieur

git --version
# 2.x.x ou superieur
```

## Installation

### 1. Cloner le repository

```bash
git clone https://github.com/Froggys974/projet-annuel-4IWJ-tips.git
cd projet-annuel-4IWJ-tips/frontend
```

### 2. Installer les dependances

```bash
npm install
```

Cette commande installe toutes les dependances listees dans `package.json`.

**Duree:** 1-2 minutes selon la connexion internet.

### 3. Configuration de l'environnement

Creer un fichier `.env` a la racine du dossier `frontend`:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Editer le fichier `.env` avec les bonnes valeurs:

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NUXT_PUBLIC_SITE_ENV=development
```

**Variables:**

- `NUXT_PUBLIC_API_BASE_URL` - URL du backend API
- `NUXT_PUBLIC_SITE_ENV` - Environnement (development, staging, production)

## Lancer en developpement

### Demarrer le serveur de dev

```bash
npm run dev
```

Le serveur demarre sur `http://localhost:3000`.


### Acceder a l'application

Ouvrir le navigateur a l'adresse:

```
http://localhost:3000
```

## Scripts disponibles

### Development

```bash
npm run dev          # Demarre le serveur de dev
npm run dev:host     # Demarre en mode host (accessible reseau)
```

### Build

```bash
npm run build        # Compile pour production
npm run generate     # Genere un site statique (SSG)
```

### Preview

```bash
npm run preview      # Preview du build de production
```

Lance un serveur local pour tester le build de production.

### Linting

```bash
npm run lint         # Verifie le code avec ESLint
npm run lint:fix     # Corrige automatiquement les erreurs
```

### Formatting

```bash
npm run format       # Formate le code avec Prettier
npm run format:check # Verifie le formatage sans modifier
```

### Post-install

```bash
npm run postinstall  # Prepare Nuxt (execute auto apres npm install)
```

## Structure des ports

| Service | Port | URL |
|---------|------|-----|
| Frontend dev | 3000 | http://localhost:3000 |
| Backend API | 3001 | http://localhost:3001 |
| WebSocket | 3001 | ws://localhost:3001 |

**Important:** Le backend doit etre lance avant le frontend pour que l'API soit accessible.

## Lancer le backend

Le frontend a besoin du backend pour fonctionner. Lancer le backend dans un terminal separe:

```bash
cd ../backend
npm install
npm run dev
```

Le backend demarre sur `http://localhost:3001`.

### Compiler l'application

```bash
npm run build
```

**Output:** Dossier `.output/` avec le build optimise.

**Duree:** 30-60 secondes.

### Tester le build localement

```bash
npm run preview
```

Lance un serveur local servant le build de production.

**URL:** `http://localhost:3000`

### Structure du build

```
.output/
├── public/          # Assets statiques
│   ├── _nuxt/       # JS/CSS bundles
│   └── ...
└── server/          # Serveur Node.js
    └── index.mjs
```

## Deploiement

### Docker

Le projet inclut un Dockerfile multi-stage:

```bash
# Build l'image
docker build -t aideflash-frontend .

# Lancer le conteneur
docker run -p 3000:3000 aideflash-frontend
```

### Variables d'environnement en production

Passer les variables d'environnement au conteneur:

```bash
docker run -p 3000:3000 \
  -e NUXT_PUBLIC_API_BASE_URL=https://api.aideflash.fr \
  -e NUXT_PUBLIC_SITE_ENV=production \
  aideflash-frontend
```

### Nginx

Le projet inclut une config Nginx dans `/nginx/default.conf`:

- Reverse proxy vers Node.js
- Gestion des assets statiques
- Compression gzip
- Cache headers

## Environnements

### Development

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NUXT_PUBLIC_SITE_ENV=development
```

### Staging

```env
NUXT_PUBLIC_API_BASE_URL=https://staging-api.aideflash.fr/api
NUXT_PUBLIC_SITE_ENV=staging
```

**Caracteristiques:**

- Build optimise
- Pas de logs debug
- Robots.txt: disallow all

### Production

```env
NUXT_PUBLIC_API_BASE_URL=https://api.aideflash.fr/api
NUXT_PUBLIC_SITE_ENV=production
```

**Caracteristiques:**

- Build optimise
- Minification
- Code splitting
- Robots.txt: allow public pages
