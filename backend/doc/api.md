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
**GET /api/users/me/perks** - Perks unlocked by my grade
**GET /api/users/leaderboard** - User rankings

## Tips

**GET /api/tips** - List tips
**POST /api/tips** - Create tip
**GET /api/tips/:id** - Tip details
**PATCH /api/tips/:id** - Update tip
**DELETE /api/tips/:id** - Delete tip
**GET /api/tips/tags/all** - List category names
**GET /api/tips/trending** - Trending tips (?days=1|7|30)
**GET /api/categories** - Categories (tips count, followed)
**GET /api/categories/followed** - Followed categories
**POST|DELETE /api/categories/:id/follow** - Follow / unfollow a category

## Comments, votes, reports

**GET /api/tips/:tipId/comments** - List comments (with replies)
**POST /api/tips/:tipId/comments** - Create comment / reply
**PATCH /api/comments/:id** - Update own comment
**DELETE /api/comments/:id** - Delete own comment
**POST /api/tips/:tipId/votes** - Vote on tip
**POST /api/comments/:id/votes** - Vote on comment
**POST /api/tips/:tipId/reports** - Report tip
**POST /api/comments/:id/reports** - Report comment

## Messages, blocks, notifications

**GET /api/conversations** - My conversations (unread counts)
**GET /api/conversations/:id** - Conversation messages (marks as read)
**GET /api/conversations/with/:userId** - Conversation status with a member
**POST /api/messages** - Send a private message
**PATCH /api/messages/:id** - Edit own unread message
**GET /api/blocks** - Users I blocked
**POST /api/users/:id/block** - Block a user
**DELETE /api/users/:id/block** - Unblock a user
**GET /api/notifications** - My notifications
**PATCH /api/notifications/:id/read** - Mark one as read
**POST /api/notifications/read-all** - Mark all as read

## Chatbot

**GET /api/chatbot/config** - Greeting message
**POST /api/chatbot/ask** - Ask the chatbot
**GET|PATCH /api/admin/chatbot/config** - Chatbot settings (admin)
**GET|POST /api/admin/chatbot/responses**, **PATCH|DELETE /api/admin/chatbot/responses/:id** - Canned responses (admin)
**GET /api/admin/chatbot/queries** - Asked questions (?unanswered=true)

## Plateforme

**GET /api/features** - Experimental features enabled for the current user
**POST /api/logs/client** - Report a frontend JavaScript error
**GET /api/admin/features**, **PATCH /api/admin/features/:key** - Feature flags / A/B tests (admin)
**GET /api/admin/logs**, **DELETE /api/admin/logs** - Centralized error logs (admin)

## Sponsoring

**GET /api/ads/placement** - Sponsored tip to display (?categoryId=&exclude=)
**GET /api/ads/:id/click** - Count click and redirect to the partner
**GET /api/challenges** - Active sponsored challenges
**GET|POST /api/admin/ads**, **PATCH|DELETE /api/admin/ads/:id** - Campaigns (admin)
**POST /api/admin/ads/image** - Upload campaign image (admin)
**GET /api/admin/ads/:id/stats**, **GET /api/admin/ads/:id/stats.csv** - Campaign statistics (admin)
**GET|POST /api/admin/challenges**, **PATCH|DELETE /api/admin/challenges/:id** - Sponsored challenges (admin)

## Uploads

**POST /api/uploads/tips** - Upload tip images (multipart)

## Moderation

**GET /api/moderation/tips/pending** - Pending tips
**POST /api/moderation/tips/:id/approve** - Approve tip
**POST /api/moderation/tips/:id/reject** - Reject tip
**GET /api/moderation/reports** - List reports
**POST /api/moderation/reports/:id/resolve** - Resolve report
**POST /api/moderation/users/:id/warn** - Formal warning
**POST /api/moderation/users/:id/downgrade** - Downgrade one grade
**GET /api/moderation/users/:id/actions** - Moderation history of a user
**GET /api/moderation-actions/mine** - My sanctions
**POST /api/moderation-actions/:id/appeal** - Contest a sanction

## Admin

**GET /api/admin/analytics** - Dashboard
**GET /api/admin/users** - Users (search, roles, sanctions, trust index)
**POST|DELETE /api/admin/users/:id/ban** - Ban / unban
**POST|DELETE /api/admin/users/:id/mute** - Mute / unmute
**PATCH /api/admin/users/:id/trust-index** - Adjust trust index
**POST /api/admin/users/:id/reset** - Reset progression
**DELETE /api/admin/users/:id** - Delete account
**GET /api/admin/appeals** - Appeals
**POST /api/admin/appeals/:id/resolve** - Accept / reject appeal
**GET|POST /api/admin/grades**, **PATCH|DELETE /api/admin/grades/:id** - Grades
**GET /api/admin/users/:id/trust** - Trust index breakdown
**GET /api/admin/trust/ranking** - Most / least trusted users
**GET /api/admin/trust/watchlist** - Moderators to review
**POST /api/admin/trust/recompute** - Recompute all trust indexes now
**GET /api/admin/badges**, **PATCH /api/admin/badges/:id** - Badges

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

## Messagerie privee

Toutes ces routes demandent d'etre connecte. Conversations a deux uniquement.

### POST /api/messages

**Body:** `recipientId`, `content` (1-2000 caracteres). Cree la conversation si besoin.

Regles :

- tant que le destinataire n'a jamais repondu, un seul message est autorise (403) ;
- impossible d'ecrire a un membre bloque, ou qui vous a bloque (403) ;
- impossible de s'ecrire a soi-meme (400).

**Reponse (201):** `{ conversationId, message }`. Le destinataire recoit `message:new` et une notification en temps reel.

### GET /api/conversations/:id

Renvoie `{ id, otherUser, restriction, messages }` et marque la conversation comme lue (l'autre participant recoit `conversation:read`).

Chaque message contient `isMine`, `isRead` (lu par le destinataire) et `canEdit`.

`restriction` vaut `null` (envoi possible), `waiting_reply`, `you_blocked` ou `blocked`.

### GET /api/conversations/with/:userId

`{ conversationId | null, otherUser, restriction }` : pour ouvrir le fil depuis le profil d'un membre.

### PATCH /api/messages/:id

**Body:** `content`. Auteur uniquement, et seulement tant que le destinataire n'a pas lu le message (sinon 403).

### Blocage

`POST /api/users/:id/block` / `DELETE /api/users/:id/block` / `GET /api/blocks`. Le blocage empeche les messages prives dans les deux sens.

---

## Notifications

Stockees en base et poussees en temps reel. Types : `NEW_MESSAGE` (une seule notification non lue par conversation), `BADGE_UNLOCKED`.

**GET /api/notifications** : `{ items, unreadCount }` (50 dernieres). Chaque notification a `title`, `body`, `link` (page du frontend a ouvrir) et `readAt`.

Ouvrir une conversation marque ses notifications comme lues.

---

## Moderation avancee

Routes `/api/moderation/*` : moderateur actif ou admin.

### POST /api/moderation/users/:id/warn et /downgrade

**Body:** `reason` (5-500 caracteres).

- `warn` : avertissement formel, notifie a l'utilisateur.
- `downgrade` : l'XP redescend au seuil du grade inferieur (400 si deja au plus bas). L'XP precedente est gardee dans `metadata` pour pouvoir l'annuler.

Un moderateur ne peut sanctionner ni lui-meme (400), ni un moderateur ou un admin (403).

Chaque action de moderation (validation/refus de tip, signalement traite, avertissement, retrogradation) rapporte **+3 XP** au moderateur.

### Contestations

- `GET /api/moderation-actions/mine` : sanctions recues (`WARN`, `DOWNGRADE`, `BAN`, `MUTE`, `REJECT_TIP`, `RESOLVE_REPORT_REJECT`) avec `canAppeal` et l'etat de la contestation.
- `POST /api/moderation-actions/:id/appeal` : **Body:** `reason` (10-1000). Une seule contestation par action (409).
- `POST /api/admin/appeals/:id/resolve` : **Body:** `decision` (`ACCEPTED` ou `REJECTED`), `response` optionnelle. Accepter annule l'action : ban/mute leves, XP restauree, tip remis en validation (refus) ou republie (signalement). L'action est marquee `overturnedAt`.

---

## Administration

Routes `/api/admin/*` : admin uniquement. Un admin ne peut pas agir sur lui-meme (400) ni sur un autre admin (403).

### Sanctions

- `POST /api/admin/users/:id/ban` : **Body:** `reason`, `days` optionnel (absent = definitif). Un compte banni ne peut plus se connecter ni renouveler son token (403) ; l'acces est coupe au plus tard 15 min apres (expiration du token d'acces).
- `POST /api/admin/users/:id/mute` : **Body:** `reason`, `days` (obligatoire). Le compte peut se connecter mais ne peut plus publier de tip, commentaire ou message (403).
- `DELETE` sur ces routes leve la sanction.

### Comptes

- `PATCH /api/admin/users/:id/trust-index` : **Body:** `trustIndex` (0-100), `reason`. L'ecart avec la valeur calculee est memorise (`trustAdjustment`) pour survivre aux recalculs. L'ancienne valeur est tracee dans l'historique de moderation.
- `GET /api/admin/users?sort=trust-asc|trust-desc` : comparer les membres par indice.
- `POST /api/admin/users/:id/reset` : remet XP, grade, badges et indice de confiance a zero (le contenu est conserve).
- `DELETE /api/admin/users/:id` : supprime le compte et son contenu.

### Grades et badges

- Grades : creation, modification (nom, seuil d'XP), suppression. Chaque changement reaffecte le bon grade a tous les membres.
- Badges : nom, description, icone et XP gagnee sont modifiables. L'XP du badge en base est celle reellement attribuee. Les conditions d'obtention restent dans le code.

### GET /api/admin/analytics

Utilisateurs (total, nouveaux et actifs sur 30 jours), tips par statut et par jour, categories populaires, file de moderation (signalements, contestations, bannis) et meilleurs contributeurs.

---

## Indice de confiance

Score cache de 0 a 100 (base 50), jamais renvoye aux membres. Poids et seuils : `backend/src/modules/trust/trust.config.ts`.

### Calcul

| Facteur | Effet |
|---|---|
| Tips publies, votes « utile » moyens par tip | + |
| Ratio utile / pas utile recu (a partir de 5 votes) | + / - |
| Commentaires ecrits, commentaires recus | + |
| Diversite des categories, anciennete, connexion recente | + |
| Contenus retires apres signalement valide | - - |
| Tips refuses a la validation | - |
| Sanctions non annulees (avertissement, retrogradation, mute, ban) | - - |
| Signalements abusifs (signalements rejetes) | - |
| Contestations rejetees | - |
| Moderateur : actions sur 90 jours | + |
| Moderateur : decisions annulees par un admin | - - |
| Moderateur : aucune action sur 30 jours | - |

Une sanction annulee apres contestation ne compte plus. Non mesures faute de donnees : duree de session, score d'orthographe (NLP), rapidite de reponse.

### Utilisation

- **Anti-troll :** pas de montee en grade sous un indice de 35.
- **Promotion automatique :** un membre passe moderateur s'il remplit toutes ces conditions :
  - indice d'au moins 80 ;
  - au moins 500 XP ;
  - au moins 30 jours d'anciennete ;
  - au moins 10 tips publies ;
  - aucune sanction en cours.

  L'action est tracee `AUTO_PROMOTE`, avec `moderatorId` a null (action du systeme).
- **Retrogradation des moderateurs :**
  - automatique sous un indice de 30 (`AUTO_DEMOTE`) ;
  - assistee sous 45, ou en cas d'inactivite de 30 jours : le moderateur apparait dans `GET /api/admin/trust/watchlist` et l'admin decide.

### Recalcul

- Au demarrage du serveur, puis toutes les heures (`trust.scheduler.ts`, desactive en test).
- Immediatement pour les utilisateurs concernes apres une sanction, un signalement traite ou une contestation tranchee.
- A la demande via `POST /api/admin/trust/recompute`.

---

## Gamification : avantages par grade

Regles dans `backend/src/modules/gamification/gamification.config.ts`, verifiees a la creation et a la modification d'un tip.

### Questions et tips

`POST /api/tips` accepte `kind` : `TIP` (defaut) ou `QUESTION`. `GET /api/tips?kind=QUESTION` filtre la liste.

- Les **questions** sont ouvertes a tous les membres ; les reponses passent par les commentaires.
- **Proposer un tip** demande au moins **20 XP** (403 sinon). L'XP se gagne en posant des questions, en commentant, en recevant des votes...

### Limites selon le rang du grade

Le rang est la position du grade du membre (le plus bas = 0), tries par XP requise.

| Rang | Publications / 24 h | Longueur max | Images | Localisation |
|---|---|---|---|---|
| 0 | 2 | 1 500 | 1 | non |
| 1 | 3 | 3 000 | 3 | oui |
| 2 | 5 | 5 000 | 5 | oui |
| 3 et + | 10 | 10 000 | 5 | oui |

Les moderateurs et admins ont les limites du dernier rang.

En cas de depassement :

- quota atteint : 403 ;
- contenu trop long ou trop d'images : 400 ;
- localisation non debloquee : 403.

### Permissions des moderateurs

Retrograder un membre (`POST /api/moderation/users/:id/downgrade`) demande **100 XP** au moderateur (403 sinon). Chaque action de moderation rapporte 3 XP. Les admins en sont dispenses.

### GET /api/users/me/perks

`{ xp, isStaff, grade, perks, publishedToday, remainingToday, canPublishTip, minXpToPublishTip, nextGrade: { name, xpRequired, xpMissing, perks }, enforced }`

### Tests

`GAMIFICATION_ENFORCE=false` desactive ces regles. `jest.setup.ts` le fait pour les tests qui ne portent pas sur la gamification ; `gamification.integration.test.ts` les reactive.

---

## Chatbot

Assistant sans service externe : il cherche dans les tips publies et dans les reponses types gerees par l'admin. Code : `backend/src/modules/chatbot/`.

### POST /api/chatbot/ask

**Authentification:** Requise (limite a 10 questions par minute)

**Body:** `question` (3-500 caracteres)

**Reponse (200):** `{ answer, context, link, tips, suggestAskingCommunity }`

1. La question est normalisee : minuscules, accents retires, mots vides ignores, pluriels simplifies, mots rapproches par racine commune ("reparation" / "reparer").
2. **Reponse type :** la premiere reponse active (par priorite) dont un mot-cle a tous ses mots dans la question fournit `answer` et `link`.
3. **Tips :** chaque tip publie est note. Un mot trouve dans le titre vaut 3, dans une categorie 2, dans le contenu 1, et les votes « utile » ajoutent un petit bonus. Les tips qui retrouvent moins d'un tiers des mots de la question sont ecartes. Les 3 meilleurs sont renvoyes, chacun avec un extrait (`snippet`).
4. **Ni reponse type ni tip :** le message de repli est renvoye avec `suggestAskingCommunity: true`. Le frontend propose alors de poser la question a la communaute, avec le formulaire pre-rempli.
5. `context` est le texte de contexte configure par l'admin, ajoute a chaque reponse.

Chaque question est enregistree, avec le nombre de tips trouves et la reponse type utilisee.

### Administration

- `PATCH /api/admin/chatbot/config` : `greeting`, `fallbackMessage`, `contextNote` (chaine vide = aucun contexte).
- Reponses types : `keywords` (1 a 20 expressions), `answer`, `link` (chemin interne uniquement, ex. `/settings`), `priority` (0-100), `isActive`.
- `GET /api/admin/chatbot/queries?unanswered=true` : questions sans tip ni reponse type, pour creer de nouvelles reponses.

---

## Fonctionnalites experimentales (tests A/B)

Les fonctionnalites sont declarees dans `backend/src/modules/features/feature.service.ts` (`FEATURE_DEFINITIONS`). Elles sont creees en base a la premiere lecture, activees a 100 % par defaut.

| Cle | Effet quand elle est coupee |
|---|---|
| `chatbot` | `/api/chatbot/*` renvoie 404, la bulle de l'assistant est masquee |
| `trends_page` | `GET /api/tips/trending` renvoie 404, le lien Tendances est masque |

- **Deploiement partiel :** `PATCH /api/admin/features/:key` avec `{ enabled, rolloutPercentage }` (0-100).
- **Repartition des membres :** un membre voit la fonctionnalite si `sha256("cle:userId") % 100 < rolloutPercentage`. Le groupe est donc stable : un membre reste toujours dans le meme groupe tant que le pourcentage ne change pas. Les visiteurs ne la voient que si elle est deployee a 100 %.
- **`GET /api/features`** (auth optionnelle) : `{ chatbot: boolean, trends_page: boolean }` pour l'utilisateur courant.
- **`GET /api/admin/features`** : chaque fonctionnalite avec `exposedUsers` et `totalUsers` (taille reelle du groupe).

---

## Logs d'erreurs centralises

Table `ErrorLog`, consultee dans l'onglet Logs de l'admin.

- **Serveur :** toute reponse >= 500 (avec methode, route, statut, utilisateur et stack), les exceptions et promesses non gerees du process, et les echecs du recalcul de l'indice de confiance. Les erreurs 4xx (404, validation...) ne sont pas enregistrees.
- **Navigateur :** `POST /api/logs/client` (auth optionnelle, 10 par minute). **Body:** `message`, `stack`, `path` et `context`, tous optionnels sauf `message`. Le frontend y envoie les erreurs Vue, les erreurs `window` et les promesses rejetees, au plus 10 par session et sans doublon.
- **`GET /api/admin/logs`** : **Query params:** `source` (`server` ou `client`), `q` (recherche dans le message ou la route), `skip`, `take`. Reponse `{ items, total, last24h }`.
- **`DELETE /api/admin/logs?olderThanDays=30`** : purge (0 = tout supprimer).

---

## Publicite : tips sponsorises et defis sponsorises

Code : `backend/src/modules/sponsoring/`.

Principes :

- publicite native, toujours marquee « Sponsorise » ;
- aucune pub dans la messagerie, la moderation ou l'administration ;
- statistiques agregees par jour (affichages, clics), sans suivi individuel ni donnee transmise au partenaire ;
- coupure globale ou test A/B via le flag `ads`.

### Tips sponsorises

**`GET /api/ads/placement`** (auth optionnelle)

- **Query params:** `categoryId` (categorie consultee), `exclude` (ids deja affiches, separes par des virgules).
- **Reponse:** `{ id, sponsorName, title, body, imageUrl }`, ou `null` s'il n'y a rien a afficher ou si le flag `ads` est coupe. Le ciblage, le budget et l'URL du partenaire ne sont jamais exposes.
- **Campagnes eligibles :** statut `ACTIVE`, periode en cours, budget d'affichages non atteint, audience compatible (`ALL`, `MEMBERS` ou `GUESTS`).
- **Ciblage par categorie** (liste vide = toutes) : on compare avec la categorie consultee ou, a defaut, avec les categories suivies par le membre.
- **Ciblage par grade** (liste vide = tous) : on compare avec le grade du membre.
- **Choix :** la priorite la plus haute d'abord, avec une rotation aleatoire entre campagnes de meme priorite.
- **Comptage :** un affichage est compte quand la pub est servie.

**`GET /api/ads/:id/click`** : compte le clic puis redirige (302) vers l'URL du partenaire, en `https` uniquement. Les cartes utilisent `rel="sponsored noopener noreferrer"`.

**Administration**

- `POST /api/admin/ads` : `name`, `sponsorName`, `title`, `body`, `targetUrl` (https), `imageUrl` (renvoye par `POST /api/admin/ads/image`), `status`, `audience`, `targetCategoryIds`, `targetGradeIds`, `startsAt`, `endsAt` (optionnel), `maxImpressions` (budget, optionnel), `priority`.
- `GET /api/admin/ads/:id/stats` : `{ campaign, totals: { impressions, clicks, ctr }, days }`.
- `GET /api/admin/ads/:id/stats.csv` : rapport pour le partenaire (separateur `;`, encodage UTF-8 avec BOM pour Excel).

### Defis sponsorises

**`GET /api/challenges`** (auth optionnelle) : defis en cours, avec `rewardsGiven`, `remainingRewards` et `completedByMe`.

**Recompense**

- Elle est versee automatiquement quand un moderateur publie un **tip** (pas une question) de la categorie du defi.
- Le tip doit avoir ete cree pendant le defi.
- Le bonus `xpBonus` est verse une seule fois par membre et par defi (contrainte unique), dans la limite de `maxRewards`.
- Le membre recoit une notification `CHALLENGE`.

**Administration :** `sponsorName`, `title`, `description`, `categoryId`, `xpBonus` (1-1000), `startsAt`, `endsAt`, `maxRewards` (optionnel), `isActive`, `campaignId` (campagne associee, optionnel).

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

**Authentification:** Optionnelle

- Visiteur non connecte : apercu du tip publie (`isPreview: true`, contenu tronque a 200 caracteres, sans images ni commentaires). La liste `GET /api/tips` renvoie aussi des apercus aux visiteurs.
- Membre connecte : contenu complet. Chaque consultation est comptee comme une vue (une par membre, chaque visite pour un visiteur).
- Tip non publie (en attente ou refuse) : visible uniquement par son auteur, les moderateurs et les admins (404 sinon).

Les commentaires (`GET /api/tips/:tipId/comments`) sont reserves aux membres connectes.

### GET /api/tips/trending

**Query params:** `days` = 1, 7 (defaut) ou 30.

Tips publies classes par activite sur la periode. Score : +3 par vote utile, -2 par vote pas utile, +2 par commentaire, +0,5 par vue, +5 si le tip a ete publie pendant la periode. A score egal, le plus recent passe devant. 20 resultats, chacun avec un objet `trending` (`score`, `upvotes`, `downvotes`, `comments`, `views`).

### Categories suivies

- `GET /api/categories` (auth optionnelle) : `[{ id, name, description, tipsCount, isFollowed }]`.
- `POST /api/categories/:id/follow` / `DELETE` : suivre ou ne plus suivre.
- Quand un moderateur publie un tip, chaque abonne a l'une de ses categories recoit une notification `NEW_TIP` en temps reel (une seule meme s'il suit plusieurs categories du tip, jamais pour son propre tip).

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

Les parametres de requete invalides (ex: `?take=abc`) renvoient 400 avec le detail dans `details`.


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

Le client se connecte avec `auth: { token: <accessToken> }`.

- Sans token : evenements publics uniquement (`tip:approved`, `tip:rejected`).
- Avec un token valide : le socket rejoint la room privee de l'utilisateur et recoit aussi `message:new`, `message:updated`, `conversation:read`, `notification:new` et `badge:unlocked`.

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
