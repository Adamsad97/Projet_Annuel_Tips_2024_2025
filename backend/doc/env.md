# Variables d'environnement (backend)

Lues au démarrage par `src/config/env.ts`. Modèle : `.env.sample`.

| Variable | Obligatoire | Défaut | Rôle |
|---|---|---|---|
| `DATABASE_URL` | oui | — | connexion PostgreSQL (`postgresql://user:pass@hôte:5432/base?schema=public`) |
| `JWT_SECRET` | oui | — | signature des jetons d'accès |
| `REFRESH_SECRET` | oui | — | signature des jetons de rafraîchissement, différent de `JWT_SECRET` |
| `NODE_ENV` | non | `development` | `development`, `test` ou `production` |
| `PORT` | non | `4000` | port de l'API (`3001` dans `.env.sample` et Docker) |
| `HOST` | non | `localhost` | affiché dans le log de démarrage (l'API écoute sur toutes les interfaces) |
| `CORS_ORIGIN` | non | `http://localhost:3000` | origine du site autorisée (API et Socket.io) ; inutile en production derrière nginx (même domaine) |
| `GAMIFICATION_ENFORCE` | non | activé | `false` désactive les limites liées au grade (utilisé par les tests) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Docker | — | création de la base par le conteneur PostgreSQL |

## Production

L'API refuse de démarrer si `JWT_SECRET` ou `REFRESH_SECRET` contient `change_me` (valeur d'exemple) ou fait moins de 32 caractères. Générer chaque secret avec :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Les fichiers `.env`, `.env.test` et `.env.production` ne sont pas versionnés.
