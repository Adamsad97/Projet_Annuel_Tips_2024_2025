# API Routes

All routes prefixed with `/api`.

## Health

**GET /api/ping** - Server health check

## Auth

**POST /api/users/register** - Create account (username, email, password)
**POST /api/users/login** - Login (email, password)
**POST /api/auth/refresh** - Refresh token
**POST /api/auth/logout** - Logout

## User

**GET /api/users/profile** - Current user info
**GET /api/users/me/progress** - Gamification progress
**GET /api/users/me/badges** - User badges
**GET /api/users/leaderboard** - User rankings

## Tips

**GET /api/tips** - List tips
**POST /api/tips** - Create tip
**GET /api/tips/:id** - Tip details
**PATCH /api/tips/:id** - Update tip
**DELETE /api/tips/:id** - Delete tip
**GET /api/tips/tags/all** - List category names

## Uploads

**POST /api/uploads/tips** - Upload tip images (multipart)

## Moderation

**GET /api/moderation/tips/pending** - Pending tips
**POST /api/moderation/tips/:id/approve** - Approve tip
**POST /api/moderation/tips/:id/reject** - Reject tip
**GET /api/moderation/reports** - List reports
**POST /api/moderation/reports/:id/resolve** - Resolve report

**Body:** `refreshToken`

**Reponse (200):** Message de confirmation

---

## Routes tips

Base: `/api/tips`

### GET /api/tips

Lister les tips.

Seuls les tips `APPROVED` sont renvoyes.

**Query params:**

- `q` : recherche dans le titre et le contenu
- `category` : nom de categorie (insensible a la casse)
- `located=true` : uniquement les tips geolocalises (utilise par la carte)
- `skip`, `take` (max 100)

**Reponse (200):** Liste des tips avec auteur, categories, compteurs

### GET /api/tips/:id

Recuperer un tip par son ID.

**Reponse (200):** Details complets du tip

### POST /api/tips

Creer un nouveau tip (statut PENDING).

**Authentification:** Requise

**Body:**

- `title` (5-200 caracteres), `content` (min 10)
- `categories` : noms de categories existantes (max 5), sinon 400
- `address` (max 255)
- `latitude` / `longitude` : a fournir ensemble
- `images` : chemins renvoyes par `POST /api/uploads/tips` (max 5)

**Reponse (201):** Tip cree

### PATCH /api/tips/:id

Modifier un tip (auteur uniquement).

**Body:** Memes champs que la creation, tous optionnels. `categories` remplace la liste existante.

**Reponse (200):** Tip modifie

### DELETE /api/tips/:id

Supprimer un tip (auteur ou moderateur).

**Reponse (200):** Confirmation

### GET /api/tips/tags/all

Liste des noms de categories (table `Category`).

---

## Routes uploads

### POST /api/uploads/tips

Uploader des images de tip avant de creer le tip.

**Authentification:** Requise

**Body (multipart/form-data):** champ `images`, 5 fichiers max, 5 Mo max chacun, jpeg/png/webp/gif

**Reponse (201):** `data: ["/uploads/tips/<uuid>.jpg", ...]`

Les fichiers sont stockes dans `backend/uploads/` et servis en lecture sur `GET /api/uploads/...`.

---

## Routes moderation

Base: `/api/moderation`

**Authentification:** Requise + Role Moderateur

### GET /api/moderation/pending

Liste des tips en attente.

### POST /api/moderation/approve/:tipId

Approuve un tip (donne XP, envoie notification WebSocket).

### POST /api/moderation/reject/:tipId

Rejette un tip.

**Body:** `reason`

---

## Format des reponses

### Succes

```json
{
  "success": true,
  "data": { /* donnees */ },
  "message": "Optional message"
}
```

### Erreur

```json
{
  "success": false,
  "message": "Error message",
  "details": [
    {
      "path": "email",
      "message": "Email already exists"
    }
  ]
}
```

## Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | Succes |
| 201 | Cree avec succes |
| 400 | Erreur validation |
| 401 | Non authentifie |
| 403 | Non autorise (role) |
| 404 | Non trouve |
| 429 | Trop de requetes (rate limit) |
| 500 | Erreur serveur |

## Authentification

### Headers requis

Pour les routes protegees:

```
Authorization: Bearer <access_token>
```

### Expiration

- Access token: 15 minutes
- Refresh token: 7 jours

Utiliser `/api/auth/refresh` pour renouveler.

## Rate limiting

| Route | Limite |
|-------|--------|
| /api/auth/* | 50 req / 15 min |
| /api/* (general) | 500 req / 15 min |
| /api/moderation/* | 10 req / min |

Depasse la limite → 429 Too Many Requests

## Interaction avec le frontend

### Flux typique

1. **Register/Login** → Recoit tokens JWT
2. **Stocker tokens** → LocalStorage (frontend)
3. **Requetes API** → Header Authorization avec access token
4. **Token expire** → Refresh avec refresh token
5. **Logout** → Invalider refresh token

### WebSocket

Le backend emet des evenements WebSocket:

- `tip:approved` - Tip approuve par moderateur
- `tip:rejected` - Tip rejete
- `badge:unlocked` - Badge debloque

Le frontend ecoute ces evenements pour afficher des notifications.

## Documentation complete

Pour une liste exhaustive de toutes les routes, consulter:

- `src/config/routes.ts` - Constantes de routes
- `src/routes/index.ts` - Agregation des routes
- Fichiers `*.routes.ts` dans chaque module

## Resume

Le backend expose:

- Routes d'authentification (register, login, refresh, logout)
- Routes utilisateur (profil, progression, badges, classement)
- Routes tips (CRUD complet)
- Routes moderation (approuver/rejeter tips)

Toutes les routes retournent du JSON avec format uniforme.

Les routes protegees necessitent un JWT dans le header Authorization.

Le systeme de gamification (XP, badges) fonctionne automatiquement lors des actions utilisateur.
