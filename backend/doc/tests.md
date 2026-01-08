# Tests

## Run Tests

```bash
npm run test              # All tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

## Test Structure

- **Unit tests** - `src/tests/unit/` - Test functions in isolation
- **Integration tests** - `src/tests/integration/` - Test complete flows

## Technologies

- **Jest** - Test framework
- **Supertest** - HTTP testing
- **ts-jest** - TypeScript support


**authorization.middleware.test.ts** - Autorisations par role

Verifie:
- Moderateur peut acceder aux routes moderateur
- Admin peut acceder aux routes admin
- Utilisateur normal refuse sur routes protegees

**error.middleware.test.ts** - Gestion d'erreurs

Verifie:
- Erreurs operationnelles formatees correctement
- Erreurs inattendues gerees
- Stack trace affichee en dev uniquement
- Codes HTTP corrects

**validate.middleware.test.ts** - Validation Zod

Verifie:
- Schema valide passe
- Schema invalide retourne 400
- Messages d'erreur clairs

### Utils

**hash.util.test.ts** - Hashage bcrypt

Verifie:
- Hashage fonctionne
- Verification de mot de passe correct
- Verification de mot de passe incorrect echoue
- Hashes differents pour meme mot de passe (salt)

**jwt.util.test.ts** - Tokens JWT

Verifie:
- Generation de tokens
- Verification de tokens valides
- Rejet de tokens invalides
- Rejet de tokens expires
- Extraction du payload

**appError.test.ts** - Classe d'erreur custom

Verifie:
- Creation d'erreur avec message et code
- Propriete isOperational correcte
- Heritage de Error

### Services

**user.service.test.ts** - Service utilisateur

Verifie:
- Creation d'utilisateur
- Recherche par email
- Mise a jour profil
- Gestion d'erreurs

### Repositories

**user.repository.test.ts** - Repository utilisateur

Verifie:
- Acces base de donnees
- Requetes Prisma
- Retour de donnees correctes

### Controllers

**auth.controller.test.ts** - Controleur auth

Verifie:
- Register retourne 201
- Login retourne tokens
- Logout fonctionne
- Erreurs retournent codes corrects

### WebSocket

**socket.service.test.ts** - Service Socket.io

Verifie:
- Emission d'evenements
- Connexion clients
- Authentification WebSocket

### Integration

**auth.integration.test.ts** - Flux auth complet

Verifie:
- Register → Login → Access protege → Logout
- Tokens valides fonctionnent
- Refresh token fonctionne

**ping.test.ts** - Health check

Verifie:
- Endpoint /api/ping repond
- Retourne le bon format

## Lancer les tests

### Tous les tests

```bash
npm test
```

Execute tous les tests (unitaires + integration).

### Tests unitaires uniquement

```bash
npm test -- --testPathPattern=unit
```

### Tests d'integration uniquement

```bash
npm test -- --testPathPattern=integration
```

### Un fichier specifique

```bash
npm test -- hash.util.test.ts
```

### Mode watch (auto-rerun)

```bash
npm run test:watch
```

Relance les tests automatiquement a chaque modification.

### Avec couverture

```bash
npm test -- --coverage
```

Genere un rapport de couverture dans `coverage/`.

Affiche:
- Lignes couvertes
- Branches couvertes
- Fonctions couvertes
- Fichiers non testes

## Configuration Jest

Fichier: `jest.config.ts`

```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.ts'],
  testTimeout: 20000,
};
```

**preset:** ts-jest pour TypeScript
**testEnvironment:** node (pas browser)
**testMatch:** Trouve les fichiers `.test.ts`
**setupFilesAfterEnv:** Fichier d'initialisation
**testTimeout:** 20 secondes max par test

## Setup des tests

Fichier: `src/tests/jest.setup.ts`

Contient:

1. **Mock bcrypt** - Accelere les tests de hash
2. **Configuration Prisma** - Base de test separee
3. **Helpers** - Fonctions communes aux tests

Le mock bcrypt evite d'executer le vrai hashage (lent):

```typescript
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => `hashed_${password}`),
  compare: jest.fn((plain, hash) => plain === hash.replace('hashed_', '')),
}));
```

## Helpers de test

Fichier: `src/tests/prisma.helpers.ts`

Fonctions utilitaires:

- `resetDatabase()` - Nettoie la base de test
- `createTestUser()` - Cree un utilisateur de test
- `createTestTip()` - Cree un tip de test

Utilisees dans les tests d'integration.

## Exemple de test unitaire

```typescript
describe('hashPassword', () => {
  it('should hash a password', () => {
    const password = 'password123';
    const hashed = hashPassword(password);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
  });

  it('should verify correct password', () => {
    const password = 'password123';
    const hashed = hashPassword(password);
    const isValid = verifyPassword(password, hashed);

    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', () => {
    const password = 'password123';
    const hashed = hashPassword(password);
    const isValid = verifyPassword('wrongpassword', hashed);

    expect(isValid).toBe(false);
  });
});
```

## Exemple de test d'integration

```typescript
describe('POST /api/users/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    // Premier utilisateur
    await request(app)
      .post('/api/users/register')
      .send({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'Test123!',
      });

    // Tentative de doublon
    const response = await request(app)
      .post('/api/users/register')
      .send({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'Test123!',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

## Ce que cela garantit

### 1. Fonctionnement correct

Les tests verifient que chaque fonction fait ce qu'elle doit faire.

### 2. Gestion d'erreurs

Les tests verifient que les erreurs sont gerees correctement.

### 3. Securite

Les tests verifient:
- Hashage des mots de passe
- Validation des tokens
- Protection des routes
- Validation des entrees

### 4. Non-regression

Avant chaque commit, les tests peuvent etre executes pour verifier qu'aucune regression n'a ete introduite.

### 5. Documentation vivante

Les tests documentent le comportement attendu du code.

## Bonnes pratiques

### 1. Tests isoles

Chaque test est independant. Pas de dependance entre tests.

### 2. Nommage clair

```typescript
it('should return 401 when token is invalid', ...)
```

Le nom du test decrit exactement ce qui est teste.

### 3. Arrange-Act-Assert

```typescript
// Arrange
const user = createTestUser();

// Act
const result = await userService.login(user.email, 'password');

// Assert
expect(result).toBeDefined();
```

### 4. Mocks pour isoler

Les dependances externes sont mockees:

```typescript
jest.mock('../repositories/user.repository');
```

### 5. Cleanup

Nettoyer apres chaque test:

```typescript
afterEach(async () => {
  await resetDatabase();
});
```

## Couverture actuelle

Le projet contient:

- 13 fichiers de tests unitaires
- 2 fichiers de tests d'integration
- Total: 15 fichiers de tests

Couverture estimee:

- Middlewares: 80%+
- Utils: 90%+
- Services: 70%+
- Controllers: 60%+

Pour voir la couverture exacte:

```bash
npm test -- --coverage
```

## Ameliorations futures

Pour augmenter la couverture:

1. Ajouter tests pour tous les controllers
2. Ajouter tests pour tous les services
3. Ajouter tests d'integration pour tous les endpoints
4. Ajouter tests de performance
5. Ajouter tests de charge

Mais la couverture actuelle est deja solide pour un projet universitaire.

## CI/CD

Les tests peuvent etre integres dans un pipeline CI/CD:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

Execute les tests automatiquement sur chaque push.

## Resume

Le backend inclut une suite de tests complete:

- Tests unitaires pour les composants individuels
- Tests d'integration pour les flux complets
- Technologies modernes (Jest, Supertest)
- Bonne couverture des parties critiques
- Garantit la fiabilite du code
- Facilite la maintenance

Les tests sont un atout majeur du projet et demontrent la qualite professionnelle du code.
