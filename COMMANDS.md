# 📋 Guide des commandes - Projet Tips

## 🚀 Démarrage rapide

### Première installation
```bash
# À la racine du projet
npm run install:all

# Lancer tout le projet (backend + frontend)
npm run dev
# OU
npm start
```

---

## 🐳 Commandes Docker (Backend)

### Gestion des conteneurs

```bash
# Build le backend
npm run docker:build

# Démarrer tous les services (postgres, backend, adminer)
npm run docker:up

# Arrêter tous les services
npm run docker:down

# Arrêter et supprimer les volumes (⚠️ supprime les données DB)
npm run docker:clean

# Rebuild complet
npm run docker:rebuild

# Redémarrer le backend
npm run docker:restart
```

### Logs

```bash
# Tous les services
npm run docker:logs

# Seulement le backend
npm run docker:logs:backend
# OU
npm run backend:logs

# Seulement PostgreSQL
npm run docker:logs:postgres
```

### Accès au conteneur

```bash
# Ouvrir un shell dans le backend
npm run backend:shell

# Exemple: une fois dans le shell
> ls
> cat .env
> exit
```

---

## 🗄️ Commandes Base de données (Prisma)

### Migrations et synchronisation

```bash
# Appliquer le schéma Prisma à la DB (développement)
npm run db:push

# Générer le client Prisma
npm run db:generate

# Ouvrir Prisma Studio (interface web pour voir la DB)
npm run db:studio
```

### Données de test

```bash
# Ajouter des utilisateurs de test
npm run db:seed

# Reset complet de la DB (⚠️ supprime tout)
npm run db:reset
```

### Workflow de modification du schéma

```bash
# 1. Modifier le schéma Prisma dans backend/prisma/schema/*.prisma

# 2. Appliquer les changements
npm run db:push

# 3. Vérifier dans Adminer ou Prisma Studio
npm run db:studio
```

---

## 🎨 Frontend

```bash
cd frontend

# Développement
npm run dev

# Build production
npm run build

# Linter
npm run lint
npm run lint:fix

# Formatter
npm run format
npm run format:check
```

---

## 🔧 Backend (local - sans Docker)

> ⚠️ Ces commandes sont pour le développement local uniquement.
> **En production, tout passe par Docker !**

```bash
cd backend

# Développement local (nécessite une DB locale)
npm run dev

# Build TypeScript
npm run build

# Démarrer en production
npm start

# Tests
npm run test
npm run test:watch
npm run test:coverage

# Linter
npm run lint
npm run lint:fix

# Formatter
npm run format
npm run format:check

# Prisma (local)
npm run prisma:generate
npm run prisma:push
npm run prisma:studio
npm run seed
```

---

## 📦 Commandes depuis la racine

### Qualité de code

```bash
# Linter sur tout le projet
npm run lint

# Formatter sur tout le projet
npm run format
```

### Workflow complet de développement

```bash
# 1. Première fois
npm run install:all

# 2. Lancer le projet complet
npm run docker:dev    # Build + DB + Seed
cd frontend && npm run dev

# 3. Après modification du schéma Prisma
npm run db:push

# 4. Après modification du code backend
npm run backend:restart
npm run backend:logs

# 5. Avant un commit
npm run lint
npm run format
```

---

## 🌐 URLs des services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Application Nuxt.js |
| **Backend API** | http://localhost:3001 | API Express |
| **Ping** | http://localhost:3001/api/ping | Test backend |
| **Adminer** | http://localhost:8080 | Interface DB web |
| **Prisma Studio** | http://localhost:5555 | Interface Prisma |

### Connexion Adminer

- **Système:** PostgreSQL
- **Serveur:** postgres
- **Utilisateur:** tips_user
- **Mot de passe:** tips_pass
- **Base:** tips_db

---

## 🔍 Debugging

### Le backend ne démarre pas

```bash
# Voir les logs
npm run backend:logs

# Vérifier que PostgreSQL est prêt
npm run docker:logs:postgres

# Redémarrer
npm run backend:restart
```

### Erreur Prisma "table does not exist"

```bash
# Appliquer le schéma
npm run db:push

# Vérifier les tables dans Adminer
# http://localhost:8080
```

### Reset complet

```bash
# Supprimer tout et recommencer
npm run docker:clean
npm run docker:dev
```

---

## 📝 Commandes utiles Docker (avancées)

```bash
# Voir tous les conteneurs
docker compose ps

# Logs en temps réel d'un service
docker compose logs -f backend

# Executer une commande dans un conteneur
docker compose exec backend <commande>

# Exemples:
docker compose exec backend npx prisma db push
docker compose exec backend npm run seed
docker compose exec backend sh

# Rebuild sans cache
docker compose build --no-cache backend

# Supprimer images orphelines
docker system prune -a
```

---

## 🎯 Workflows courants

### Ajouter une nouvelle table Prisma

```bash
# 1. Créer/modifier le fichier schema
# backend/prisma/schema/mon-modele.prisma

# 2. Appliquer
npm run db:push

# 3. Vérifier
npm run db:studio

# 4. Créer le module backend
# backend/src/modules/mon-module/...

# 5. Redémarrer
npm run backend:restart
```

### Modifier une route backend

```bash
# 1. Modifier le code dans backend/src/...

# 2. Le code est rechargé automatiquement (nodemon)
# Sinon:
npm run backend:restart

# 3. Vérifier les logs
npm run backend:logs
```

### Avant de commit

```bash
# Vérifier le code
npm run lint

# Formatter
npm run format

# Tests backend
cd backend && npm run test
```

---

## ⚡ Alias recommandés (optionnel)

Ajoutez dans votre `.bashrc` ou `.zshrc` :

```bash
# Racine du projet
alias tips-start="npm run docker:dev"
alias tips-stop="npm run docker:down"
alias tips-logs="npm run backend:logs"
alias tips-shell="npm run backend:shell"
alias tips-db="npm run db:studio"
```

Ensuite :
```bash
tips-start    # Démarrer
tips-logs     # Voir les logs
tips-db       # Ouvrir Prisma Studio
```
