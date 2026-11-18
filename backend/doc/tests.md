# Tests Backend

## Vue d'ensemble

Le backend dispose de **228 tests (36 fichiers)** repartis en deux categories :
- **Tests unitaires** (15 fichiers) - Testent les composants de maniere isolee
- **Tests d'integration** (21 fichiers) - Testent les flux complets avec la base de donnees et les vraies routes HTTP

## Lancer les tests

**Important** : Les tests doivent etre lances depuis la **racine du projet** car ils utilisent Docker et accedent a la base de donnees de test dans le conteneur.

```bash
# Depuis la racine du projet
npm run backend:test              # Tous les tests
npm run backend:test-coverage     # Avec rapport de couverture
```

Les commandes ci-dessus :
1. Lancent Docker Compose
2. Entrent dans le conteneur backend
3. Executent les tests avec acces a la DB de test

**Note** : Des `console.error` peuvent apparaitre pendant les tests (ex: erreurs de validation, JWT invalides). C'est normal - ils testent les comportements d'erreur.

## Structure des tests

```
src/tests/
├── integration/        # un fichier par domaine (voir tableau ci-dessous)
├── unit/
│   ├── chatbot/        # analyse du texte des questions
│   ├── controller/     # refresh / logout
│   ├── middleware/     # auth, roles, validation Zod, erreurs, rate limiting
│   ├── repository/
│   ├── service/
│   ├── utils/          # JWT, hash, AppError, lisibilite (indice de confiance)
│   └── websocket/
├── jest.setup.ts
└── prisma.helpers.ts
```

## Modules testes (integration)

| Fichier | Ce qui est couvert |
|---|---|
| `auth` | Inscription, connexion, revocation des sessions (deconnexion, changement de mot de passe) |
| `twoFactor` | Activation 2FA, connexion avec code, codes de secours, desactivation |
| `profile` | Profil, mot de passe, avatar, profil public sans donnees privees |
| `tips` | CRUD, images, localisation, categories, filtres, recherche par mot-cle |
| `discovery` | Apercu invite, tendances, vues, suivi de categories |
| `interactions` | Commentaires, votes, signalements |
| `messaging` | Messages (un seul sans reponse, edition avant lecture), blocages, notifications |
| `push` | Abonnements push du navigateur, envoi, abonnements expires |
| `uploads` | Upload et service des images |
| `gamification` | Seuil d'XP pour proposer un tip, quotas et avantages par grade |
| `xp` / `badges` | Attribution d'XP et de badges, montee en grade, classement |
| `community` | Statistiques, grades, contact, abonnements entre membres, classements |
| `moderation` | Validation des tips, signalements, promotion, stats, historique |
| `adminModeration` | Sanctions, contestations, comptes, grades/badges, analytics |
| `trust` / `trustBehaviour` | Indice de confiance : facteurs, sanctions, ajustement admin, promotion et retrogradation automatiques, sessions, lisibilite, reactivite |
| `platform` | Feature flags (tests A/B), logs centralises |
| `chatbot` | Recherche de tips, reponses types, configuration admin |
| `sponsoring` | Campagnes ciblees, budget, clics, defis sponsorises |

## Coverage

### Obtenir le rapport de couverture

```bash
npm run backend:test-coverage
```

Le rapport est genere dans `backend/coverage/`.

### Voir le rapport en mode web

```bash
cd backend/coverage/lcov-report
# Ouvrir index.html dans un navigateur
```

Le rapport HTML interactif permet de :
- Voir les lignes couvertes/non couvertes
- Naviguer dans les fichiers
- Identifier les branches non testees


## CI/CD

Le workflow `.github/workflows/ci.yml` se lance à chaque push et pull request sur `develop` et `main` (et à la demande depuis l'onglet Actions). Trois jobs :

1. **Backend** : migrations sur une base PostgreSQL neuve, compilation TypeScript, ESLint, tests.
2. **Frontend** : ESLint, typecheck (`vue-tsc`), build Nuxt.
3. **Production** (après les deux premiers) : build des images Docker de production, démarrage de la stack derrière nginx, vérification que l'API et le site répondent.

## Technologies utilisees

- **Jest** - Framework de test
- **Supertest** - Tests HTTP
- **ts-jest** - Support TypeScript
- **Prisma** - Base de donnees de test

## Setup des tests

Le fichier `jest.setup.ts` configure :

1. **Mock bcrypt** - Accelere les tests de hashage
   ```typescript
   jest.mock('bcrypt', () => ({
     hashSync: jest.fn((p) => `hashed:${p}`),
     compareSync: jest.fn((a, b) => `hashed:${a}` === b),
   }));
   ```

2. **Variables d'environnement** - Charge `.env.test`, force `NODE_ENV=test` et `GAMIFICATION_ENFORCE=false`

Aucun reset automatique de la base : le schema est applique avant les tests (`prisma migrate deploy`, fait par `npm run backend:test` et par la CI), et chaque fichier nettoie ses propres donnees.

En `NODE_ENV=test`, le suivi des sessions d'activite (indice de confiance) est desactive : une ecriture en arriere-plan pourrait sinon viser un compte deja supprime et logger apres la fin des tests, ce qui fait echouer Jest. `trustBehaviour.integration.test.ts` le reactive le temps de son test.

## Helpers de test

`prisma.helpers.ts` fournit des fonctions utilitaires :

```typescript
clearUsers()              // Nettoie les users
clearTips()              // Nettoie les tips
clearModerationData()    // Nettoie donnees moderation
seedBadges()            // Cree les badges de base
disconnectPrisma()      // Ferme la connexion
```


## Isolation des tests
Chaque test est independant grace au cleanup `beforeEach`/`afterEach`.

## Nommage naturel
Les tests utilisent des noms en francais naturel :
```typescript
it('approuve un tip et donne de xp', ...)
it('erreur si pas moderateur', ...)
```

## Tests realistes
Les tests d'integration utilisent la vraie DB et les vraies routes HTTP.

## Mocks intelligents
Les dependances lentes (bcrypt) sont mockees, mais la logique metier reste testee.

## Regles de gamification dans les tests

`src/tests/jest.setup.ts` definit `GAMIFICATION_ENFORCE=false` : les tests existants peuvent publier des tips avec des comptes neufs (0 XP, plusieurs tips d'affilee, localisation). Les regles (seuil d'XP, quotas, limites par grade) sont testees dans `gamification.integration.test.ts`, qui les reactive avec `process.env.GAMIFICATION_ENFORCE = 'true'`.
