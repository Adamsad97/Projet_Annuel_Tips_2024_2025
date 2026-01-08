# Run Backend

## Setup

```bash
# Install dependencies
npm install

# Copy environment
cp .env.sample .env

# Start database (Docker)
docker-compose up -d

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

## Run

```bash
npm run dev          # Development (with hot reload)
npm run build        # Build
npm run start        # Production
npm run test         # Tests
```

Server runs on `http://localhost:3001`

#### Option B: PostgreSQL local

Creer une base de donnees manuellement:

```bash
createdb tips_db
```

Puis adapter la `DATABASE_URL` dans `.env`.

### 5. Executer les migrations Prisma

```bash
npm run prisma:migrate:dev
```

Cree les tables dans la base de donnees.

### 6. Peupler la base de donnees (optionnel)

```bash
npm run prisma:seed
```

Cree des donnees de test. Voir [seeds.md](./seeds.md).

## Lancer le projet

### Mode developpement

```bash
npm run dev
```

Le serveur demarre sur `http://localhost:3001`.

Output attendu:

```
server running on http://localhost:3001
websocket server initialized
```

### Mode production

```bash
npm run build
npm start
```

## Verifier que tout fonctionne

### 1. Tester l'endpoint de health check

```bash
curl http://localhost:3001/api/ping
```

Reponse attendue:

```json
{
  "message": "pong",
  "timestamp": "2024-01-08T10:00:00.000Z",
  "status": "healthy"
}
```

## Lancer les tests

### Tous les tests

```bash
npm test
```

### Tests unitaires uniquement

```bash
npm test -- --testPathPattern=unit
```

### Tests d'integration uniquement

```bash
npm test -- --testPathPattern=integration
```

### Avec couverture

```bash
npm test -- --coverage
```

Genere un rapport de couverture dans `/coverage`.

Voir [tests.md](./tests.md) pour plus de details.

## Scripts disponibles

### Development

```bash
npm run dev              # Demarre le serveur en mode dev (nodemon)
npm run build            # Compile TypeScript vers JavaScript
npm start                # Demarre le serveur en mode production
```

### Database

```bash
npm run prisma:generate      # Genere le client Prisma
npm run prisma:migrate:dev   # Execute les migrations en dev
npm run prisma:migrate:prod  # Execute les migrations en prod
npm run prisma:seed          # Peuple la base avec des donnees de test
npm run prisma:studio        # Interface web pour explorer la DB
```

### Tests

```bash
npm test                 # Lance tous les tests
npm run test:watch       # Lance les tests en mode watch
```

### Code quality

```bash
npm run lint             # Verifie le code avec ESLint
npm run lint:fix         # Corrige automatiquement les erreurs
npm run format           # Formate le code avec Prettier
npm run format:check     # Verifie le formatage sans modifier
```

### Docker

```bash
npm run docker:build     # Build l'image Docker
npm run docker:up        # Demarre les conteneurs
npm run docker:down      # Arrete les conteneurs
```

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | postgresql://localhost:5432 |
| Prisma Studio | 5555 | http://localhost:5555 |
*
## Variables d'environnement requises

Voir [env.md](./env.md) pour la liste complete et leur description.

Minimalement requis:

- `DATABASE_URL` - Connexion PostgreSQL
- `JWT_SECRET` - Cle secrete pour les tokens JWT
- `REFRESH_SECRET` - Cle secrete pour les refresh tokens

## Comptes de test

Apres avoir execute `npm run prisma:seed`, les comptes suivants sont disponibles:

| Role | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@tipstop.com | Admin123! |
| Moderateur | moderator@tipstop.com | Modo123! |
| Utilisateur | alice@example.com | Alice123! |
| Utilisateur | bob@example.com | Bob123! |
| Utilisateur | charlie@example.com | Charlie123! |

## Deploiement

### Docker

```bash
docker build -t aideflash-backend .
docker run -p 3001:3001 --env-file .env aideflash-backend
```

### Production

1. Compiler le projet:

```bash
npm run build
```

2. Executer les migrations:

```bash
npm run prisma:migrate:prod
```

3. Demarrer le serveur:

```bash
npm start
```