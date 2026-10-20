# API Routes

All routes prefixed with `/api`.

## Health

**GET /api/ping** - Server health check

## Auth

**POST /api/users/register** - Create account (username, email, password)
**POST /api/users/login** - Login (email, password)
**POST /api/users/login/2fa** - Login second step (two-factor code)
**POST /api/auth/refresh** - Refresh token
**POST /api/auth/logout** - Logout

## User

**GET /api/users/profile** - Current user info
**PATCH /api/users/profile** - Update profile (firstname, lastname, bio, address)
**PATCH /api/users/profile/password** - Change password
**POST /api/users/profile/avatar** - Upload avatar (multipart)
**DELETE /api/users/profile/avatar** - Remove avatar
**POST /api/users/profile/2fa/setup** - Start 2FA setup (QR code)
**POST /api/users/profile/2fa/enable** - Enable 2FA (code)
**POST /api/users/profile/2fa/disable** - Disable 2FA (password + code)
**GET /api/users/:id** - Public profile of a member
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

## Comments, votes, reports

**GET /api/tips/:tipId/comments** - List comments (with replies)
**POST /api/tips/:tipId/comments** - Create comment / reply
**PATCH /api/comments/:id** - Update own comment
**DELETE /api/comments/:id** - Delete own comment
**POST /api/tips/:tipId/votes** - Vote on tip
**POST /api/comments/:id/votes** - Vote on comment
**POST /api/tips/:tipId/reports** - Report tip
**POST /api/comments/:id/reports** - Report comment

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

## Routes profil

Toutes ces routes demandent d'etre connecte. Les reponses ne contiennent jamais le mot de passe ni l'indice de confiance (`trustIndex`), reserve a l'admin.

### PATCH /api/users/profile

**Body (tous optionnels):** `firstname`, `lastname` (max 100), `bio` (max 500), `address` (max 255). Une chaine vide efface le champ.

**Reponse (200):** Utilisateur mis a jour

### PATCH /api/users/profile/password

**Body:** `currentPassword`, `newPassword` (8 caracteres min, majuscule, minuscule, chiffre, caractere special, different de l'actuel)

Mot de passe actuel incorrect : 400 (et non 401, pour ne pas deconnecter le frontend).

### POST /api/users/profile/avatar

**Body (multipart/form-data):** champ `avatar`, 1 image jpeg/png/webp/gif de 5 Mo max.

L'ancien avatar est supprime du disque. **Reponse (200):** Utilisateur avec `avatarProfile` = `/uploads/avatars/<uuid>.<ext>`

### DELETE /api/users/profile/avatar

Supprime l'avatar (`avatarProfile` = null).

### GET /api/users/:id

Profil public d'un membre : identite (sans email), bio, localisation, XP, grade, role (`USER`, `MODERATOR`, `ADMIN`), badges, statistiques (`publishedTips`, `comments`, `upvotesReceived`) et 10 derniers tips publies.

### GET /api/users/leaderboard

**Query params:** `skip`, `take`

**Reponse (200):** `[{ rank, userId, username, firstname, lastname, avatarProfile, xp, grade, role, tips, badges }]` (sans email)

---

## Double authentification (2FA)

TOTP compatible Google Authenticator, Authy, Microsoft Authenticator...

### Connexion d'un compte avec 2FA

1. `POST /api/users/login` avec email et mot de passe. Si la 2FA est active, la reponse ne contient pas de tokens mais `{ twoFactorRequired: true, twoFactorToken }`. Ce jeton expire au bout de 5 minutes et n'est pas accepte comme token d'acces.
2. `POST /api/users/login/2fa` avec `{ twoFactorToken, code }`. `code` est le code a 6 chiffres de l'application, ou un code de secours (`xxxx-xxxx`, utilisable une seule fois). **Reponse (200):** `{ accessToken, refreshToken, user }`. Code invalide ou jeton expire : 401.

### POST /api/users/profile/2fa/setup

**Authentification:** Requise. Genere un nouveau secret (pas encore actif).

**Reponse (200):** `{ secret, otpauthUrl, qrCode }` (`qrCode` est une image PNG en data URL)

### POST /api/users/profile/2fa/enable

**Body:** `code` (code a 6 chiffres de l'application). Active la 2FA.

**Reponse (200):** `{ backupCodes }` : 8 codes de secours, affiches une seule fois et stockes haches.

### POST /api/users/profile/2fa/disable

**Body:** `password`, `code` (code de l'application ou code de secours). Supprime le secret et les codes de secours.

Le secret et les codes de secours ne sont jamais renvoyes par les autres routes.

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

## Routes commentaires, votes et signalements

Ces actions ne sont possibles que sur un tip `APPROVED` (sinon 400).

### GET /api/tips/:tipId/comments

Liste des commentaires racines (du plus recent au plus ancien), chacun avec ses `replies` (un seul niveau).
Chaque commentaire contient `score` et `userVote` (vote de l'utilisateur connecte, 0 sinon).

**Authentification:** Optionnelle (necessaire pour `userVote`)

### POST /api/tips/:tipId/comments

**Authentification:** Requise

**Body:** `content` (2-2000 caracteres), `parentId` optionnel. Repondre a une reponse rattache au commentaire racine.

Donne +5 XP a l'auteur du commentaire.

### PATCH /api/comments/:id et DELETE /api/comments/:id

Auteur du commentaire uniquement (sinon 403). Supprimer un commentaire supprime ses reponses.

### POST /api/tips/:tipId/votes et POST /api/comments/:id/votes

**Authentification:** Requise

**Body:** `value` : `1` (utile), `-1` (pas utile) ou `0` (retirer son vote). Un seul vote par utilisateur et par contenu.

Impossible de voter pour son propre contenu (403). L'XP de l'auteur suit le vote : +2 / -1 pour un tip, +1 pour un upvote de commentaire. Retirer ou inverser son vote reprend l'XP donnee.

**Reponse (200):** `{ upvotes, downvotes, score, userVote }`. Le meme objet est renvoye dans `votes` sur `GET /api/tips/:id`.

### POST /api/tips/:tipId/reports et POST /api/comments/:id/reports

**Authentification:** Requise

**Body:** `reason` (5-500 caracteres)

Impossible de signaler son propre contenu (403) ou de signaler deux fois le meme contenu tant que le premier signalement est ouvert (409). Les signalements arrivent dans `GET /api/moderation/reports`.

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
