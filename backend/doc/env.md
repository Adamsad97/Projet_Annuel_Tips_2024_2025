# Environment Variables

Copy `.env.sample` to `.env`:

```bash
cp .env.sample .env
```

## Required Variables

**PORT** - Server port (default: 3001)
```env
PORT=3001
```

**DATABASE_URL** - PostgreSQL connection
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/tips_db?schema=public
```

**JWT_SECRET** - JWT signing key
```env
JWT_SECRET=your_long_secret_key
```

**REFRESH_SECRET** - Refresh token key
```env
REFRESH_SECRET=your_long_refresh_secret
```

**NODE_ENV** - Environment (development, test, production)
```env
NODE_ENV=development
```

**CORS_ORIGIN** - Frontend URL
```env
CORS_ORIGIN=http://localhost:3000
```

### JWT_SECRET

Cle secrete pour signer les access tokens JWT.

```env
JWT_SECRET=change_me_jwt_secret_very_long_and_secure
```

Recommandations:
- Minimum 32 caracteres
- Caracteres aleatoires
- Unique par environnement
- Ne jamais commiter en clair

Generation:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### REFRESH_SECRET

Cle secrete pour signer les refresh tokens.

```env
REFRESH_SECRET=change_me_refresh_secret_very_long_and_secure
```

Doit etre differente de `JWT_SECRET`.

Memes recommandations que `JWT_SECRET`.

### CORS_ORIGIN

URL du frontend autorisee pour CORS.

```env
CORS_ORIGIN=http://localhost:3000
```

Exemples:

**Developpement:**
```env
CORS_ORIGIN=http://localhost:3000
```

**Production:**
```env
CORS_ORIGIN=https://aideflash.fr
```

**Multiples origines (separes par virgule):**
```env
CORS_ORIGIN=http://localhost:3000,https://staging.aideflash.fr
```

## Variables optionnelles

Actuellement, aucune variable optionnelle.

Toutes les variables listees ci-dessus sont requises.

## Exemple complet

### Developpement local

```env
PORT=3001
HOST=localhost
NODE_ENV=development

DATABASE_URL=postgresql://postgres:password@localhost:5432/tips_db?schema=public

JWT_SECRET=dev_jwt_secret_change_in_production_12345678
REFRESH_SECRET=dev_refresh_secret_change_in_production_12345678

CORS_ORIGIN=http://localhost:3000
```

### Production

```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

DATABASE_URL=postgresql://tips_user:secure_password@db.aideflash.fr:5432/tips_db?schema=public&sslmode=require

JWT_SECRET=production_jwt_secret_very_long_and_random_32_chars_min
REFRESH_SECRET=production_refresh_secret_very_long_and_random_32_chars_min

CORS_ORIGIN=https://aideflash.fr
```

### Docker

```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

DATABASE_URL=postgresql://tips_user:tips_pass@postgres:5432/tips_db?schema=public

JWT_SECRET=docker_jwt_secret_change_me
REFRESH_SECRET=docker_refresh_secret_change_me

CORS_ORIGIN=http://localhost:3000
```

## Securite

### Bonnes pratiques

1. Ne jamais commiter le fichier `.env`
2. Utiliser des secrets differents par environnement
3. Generer des secrets longs et aleatoires
4. Ne pas partager les secrets en clair
5. Utiliser un gestionnaire de secrets en production

### .gitignore

Le fichier `.env` est deja dans `.gitignore`:

```
.env
```

Seul `.env.sample` est versionne (sans valeurs sensibles).

## Validation

Le fichier `src/config/env.ts` valide les variables au demarrage:

```typescript
const envSchema = z.object({
  PORT: z.string(),
  HOST: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  REFRESH_SECRET: z.string(),
  CORS_ORIGIN: z.string(),
});
```

Si une variable manque ou est invalide, le serveur refuse de demarrer.

## Problemes courants

### Variable manquante

Erreur:

```
Error: Missing required environment variable: JWT_SECRET
```

Solution: Ajouter la variable dans `.env`.

### DATABASE_URL incorrecte

Erreur:

```
Error: Can't reach database server
```

Solutions:
- Verifier le format de l'URL
- Verifier que PostgreSQL est demarre
- Tester la connexion manuellement

### CORS_ORIGIN incorrecte

Symptome: Frontend bloque par CORS.

Solution: Verifier que l'URL du frontend correspond exactement.

## Chargement des variables

Les variables sont chargees via le package `dotenv`:

```typescript
import 'dotenv/config';
```

Execute automatiquement au demarrage du serveur.

## Acces dans le code

Les variables sont accessibles via `process.env`:

```typescript
const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;
```

Le fichier `src/config/env.ts` export les variables validees:

```typescript
import { env } from './config/env';

console.log(env.PORT);
console.log(env.DATABASE_URL);
```

## Deploiement

### Docker

Passer les variables au conteneur:

```bash
docker run --env-file .env aideflash-backend
```


## Resume

7 variables requises:

1. `PORT` - Port du serveur
2. `HOST` - Nom d'hote
3. `NODE_ENV` - Environnement
4. `DATABASE_URL` - Connexion PostgreSQL
5. `JWT_SECRET` - Cle access token
6. `REFRESH_SECRET` - Cle refresh token
7. `CORS_ORIGIN` - URL frontend autorisee

Toutes doivent etre definies dans `.env`.

Le fichier `.env.sample` fournit un template avec des valeurs d'exemple.
