# Architecture

## 3-Tier Pattern

Controller → Service → Repository → Database

## Folder Structure

- **`modules/`** - Domain modules (user, tips, badges, grades, xp, moderation)
- **`middlewares/`** - Express middlewares (auth, error, validation, rate limiting)
- **`utils/`** - Utilities (hash, JWT, errors)
- **`config/`** - Environment and routes
- **`types/`** - TypeScript interfaces
- **`websocket/`** - Socket.io integration
- **`tests/`** - Unit and integration tests

## Module Structure

Each module contains:
- `controller.ts` - HTTP handlers
- `service.ts` - Business logic
- `repository.ts` - Database access
- `routes.ts` - Route definitions
- `validation.ts` - Zod schemas

Responsabilites:
- Recevoir la requete
- Extraire les parametres (body, params, query)
- Appeler le service approprie
- Retourner la reponse formatee

Exemple:

```typescript
async login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json({
    success: true,
    data: result
  });
}
```

### 2. Service

**Role:** Contenir la logique metier.

Responsabilites:
- Orchestrer les operations
- Valider la logique metier
- Appeler les repositories
- Gerer les erreurs metier
- Interagir avec d'autres services

Exemple:

```typescript
async login(email: string, password: string) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('Invalid credentials', 401);

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) throw new AppError('Invalid credentials', 401);

  const tokens = generateTokens(user);
  return { user, tokens };
}
```

### 3. Repository

**Role:** Acceder aux donnees.

Responsabilites:
- Communiquer avec la base de donnees
- Abstraire Prisma
- Retourner des donnees brutes
- Pas de logique metier

Exemple:

```typescript
export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  create(data: UserCreateInput) {
    return prisma.user.create({ data });
  }
};
```

## Middlewares

### auth.middleware.ts

Protege les routes authentifiees.

```typescript
requireAuth        // Verifie le JWT
requireModerator   // Verifie le role moderateur
requireAdmin       // Verifie le role admin
```

### validate.middleware.ts

Valide les donnees entrantes avec Zod.

```typescript
validateSchema(schema)  // Valide req.body contre un schema
```

### error.middleware.ts

Gere toutes les erreurs de l'application.

Formate les reponses d'erreur uniformes.

### rateLimiter.middleware.ts

Protege contre les abus.

- API limiter: 500 req/15min
- Auth limiter: 50 req/15min
- Strict limiter: 10 req/min

## Flux de requete

### Exemple: Creer un tip

```
1. POST /api/tips
   ↓
2. Middleware: validateSchema(createTipSchema)
   ↓
3. Middleware: requireAuth (verifie JWT)
   ↓
4. Controller: tip.controller.ts → createTip()
   ↓
5. Service: tip.service.ts → createTip()
   ↓
6. Repository: tip.repository.ts → create()
   ↓
7. Prisma Client → INSERT INTO tips
   ↓
8. Service: xpService.awardXp(userId, 'TIP_CREATED')
   ↓
9. Service: badgeService.checkAndAwardBadges(userId)
   ↓
10. Response: { success: true, data: tip }
```

## Gestion des erreurs

### Classe AppError

```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
```

Utilisee pour toutes les erreurs metier.

### Try-Catch pattern

```typescript
try {
  // Logique metier
} catch (error) {
  throw new AppError('Message explicite', 400);
}
```

### Middleware global

Attrape toutes les erreurs et formate la reponse:

```json
{
  "success": false,
  "message": "Message d'erreur",
  "stack": "..." // Uniquement en dev
}
```

## Validation

### Schema Zod

Chaque module definit ses schemas de validation:

```typescript
export const createTipSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(10),
  categoryIds: z.array(z.number()).optional()
});
```

Applique via middleware:

```typescript
router.post('/tips',
  validateSchema(createTipSchema),
  tipController.create
);
```

## Authentification

### Flux JWT

```
1. Login → genere access token (15min) + refresh token (7d)
2. Requete API → envoie access token dans header Authorization
3. Middleware verifie le token
4. Si expire → utilise refresh token pour obtenir nouveau access token
5. Si refresh expire → deconnexion
```

### Stockage

- Access token: memoire (frontend)
- Refresh token: localStorage (frontend)
- Refresh token hash: base de donnees (backend)

## WebSocket

### Service Socket.io

Gere les notifications temps reel:

```typescript
socketService.emitTipApproved(userId, tipData)
socketService.emitTipRejected(userId, tipId)
socketService.emitBadgeUnlocked(userId, badgeData)
```

### Authentification

Les connexions WebSocket sont authentifiees via JWT.

## Database (Prisma)

### Schema modulaire

Les models Prisma sont organises par fichier:

```
prisma/schema/
├── schema.prisma      # Configuration principale
├── user.prisma        # Model User
├── tip.prisma         # Model Tip
├── badge.prisma       # Models Badge, UserBadge
└── ...
```

### Migrations

Les changements de schema sont geres par migrations:

```bash
npm run prisma:migrate:dev
```

Cree un fichier de migration dans `prisma/migrations/`.

## Tests

### Structure

```
tests/
├── unit/              # Tests unitaires
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── middleware/
│   └── utils/
│
└── integration/       # Tests end-to-end
    ├── auth.integration.test.ts
    └── ping.test.ts
```

### Pattern

Chaque couche est testee independamment avec mocks pour les dependances.

Voir [tests.md](./tests.md) pour plus de details.

## Securite

### Mesures implementees

1. **Hashage bcrypt** - Mots de passe
2. **JWT** - Authentification sans session
3. **Helmet** - Headers de securite HTTP
4. **CORS** - Protection cross-origin
5. **Rate limiting** - Protection anti-spam
6. **Validation Zod** - Donnees entrantes
7. **Prisma** - Protection SQL injection
8. **TypeScript strict** - Type safety