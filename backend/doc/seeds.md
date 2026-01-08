# Seeds - Test Data

Run seeds:

```bash
npm run prisma:seed
```

Generates:
- **6 Grades** - Progression levels (Beginner → Legend)
- **9 Badges** - Achievements (unlock conditions based on XP/actions)
- **5 Categories** - Tip categories (Tech, Cooking, Health, Education, Finance)
- **5 Test Users** - Admin, Moderator, and regular users with credentials in console

#### Moderateur

```
Email:    moderator@tipstop.com
Password: Modo123!
Grade:    Maitre (1500 XP)
Role:     Moderateur
```

Peut approuver/rejeter les tips.

#### Utilisateur 1 - Alice

```
Email:    alice@example.com
Password: Alice123!
Grade:    Confirme (250 XP)
Role:     Utilisateur
```

Utilisateur actif avec plusieurs tips.

#### Utilisateur 2 - Bob

```
Email:    bob@example.com
Password: Bob123!
Grade:    Apprenti (75 XP)
Role:     Utilisateur
```

Utilisateur moderement actif.

#### Utilisateur 3 - Charlie

```
Email:    charlie@example.com
Password: Charlie123!
Grade:    Debutant (15 XP)
Role:     Utilisateur
```

Nouvel utilisateur.

### 5. Tips (8 tips)

Contenus de test dans differentes categories:

1. **Comment bien debuter avec Git ?**
   - Auteur: Alice
   - Categorie: Technologie
   - Statut: Approuve

2. **Astuces pour economiser sur les courses**
   - Auteur: Bob
   - Categorie: Finance
   - Statut: Approuve

3. **Routine matinale pour etre productif**
   - Auteur: Alice
   - Categorie: Sante
   - Statut: Approuve

4. **Recette rapide : Pates carbonara authentiques**
   - Auteur: Bob
   - Categorie: Cuisine
   - Statut: Approuve

5. **Comment apprendre une nouvelle langue rapidement**
   - Auteur: Charlie
   - Categorie: Education
   - Statut: Approuve

6. **Tip en attente de moderation**
   - Auteur: Charlie
   - Categorie: Technologie
   - Statut: En attente (PENDING)

7. **Optimiser ses performances TypeScript**
   - Auteur: Admin
   - Categorie: Technologie
   - Statut: Approuve

8. **Les meilleurs outils pour le teletravail**
   - Auteur: Moderateur
   - Categorie: Technologie
   - Statut: Approuve

## Pourquoi les seeds sont utiles

### 1. Developement rapide

Pas besoin de creer manuellement des comptes et contenus.

Demarre directement avec des donnees.

### 2. Tests manuels

Tester les fonctionnalites avec des donnees realistes:

- Login avec differents roles
- Voir des tips existants
- Tester la moderation avec un tip PENDING
- Tester le classement avec differents niveaux XP

### 3. Demonstration

Montrer l'application a un professeur avec du contenu.

### 4. Coherence

Tous les developpeurs ont les memes donnees de test.

Facilite la collaboration.

### 5. Reset facile

Possibilite de remettre la base a zero:

```bash
npm run prisma:migrate:reset
npm run prisma:seed
```

## Executer les seeds

### Premiere fois

```bash
npm run prisma:seed
```

Cree toutes les donnees.

### Apres modification

Si les seeds sont modifies, relancer:

```bash
npm run prisma:seed
```

Utilise `upsert` donc pas de doublons.

### Reset complet

Pour supprimer toutes les donnees et recommencer:

```bash
npm run prisma:migrate:reset
```

Attention: Supprime TOUTES les donnees (y compris hors seeds).

Puis:

```bash
npm run prisma:seed
```

## Upsert pattern

Les seeds utilisent `upsert`:

```typescript
await prisma.user.upsert({
  where: { email: 'admin@tipstop.com' },
  update: {},
  create: {
    username: 'admin',
    email: 'admin@tipstop.com',
    password: hashPassword('Admin123!'),
    // ...
  }
});
```

**Avantage:** Peut etre execute plusieurs fois sans erreur.

Si l'entree existe deja, elle n'est pas dupliquee.

## Hashage des mots de passe

Les mots de passe sont hashes avec bcrypt:

```typescript
password: hashPassword('Admin123!')
```

Jamais stockes en clair, meme dans les seeds.

## Configuration Prisma

Dans `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node src/seed.ts"
  }
}
```

Indique a Prisma comment executer les seeds.

## Utilisation des comptes de test

### Tester en tant qu'admin

1. Se connecter avec `admin@tipstop.com` / `Admin123!`
2. Acces a toutes les fonctionnalites
3. Peut promouvoir d'autres moderateurs

### Tester la moderation

1. Se connecter avec `moderator@tipstop.com` / `Modo123!`
2. Acceder a `/moderation`
3. Approuver/rejeter le tip en attente

### Tester en tant qu'utilisateur

1. Se connecter avec `alice@example.com` / `Alice123!`
2. Creer un tip
3. Voir ses tips
4. Commenter d'autres tips

## Modification des seeds

Pour ajouter des donnees:

1. Editer `src/seed.ts`
2. Ajouter les upserts necessaires
3. Relancer `npm run prisma:seed`

Exemple:

```typescript
await prisma.category.upsert({
  where: { name: 'Sport' },
  update: {},
  create: {
    name: 'Sport',
    description: 'Conseils sportifs et fitness'
  }
});
```