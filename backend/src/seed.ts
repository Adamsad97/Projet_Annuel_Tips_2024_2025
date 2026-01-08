import { prisma } from './db/prisma';
import { hashPassword } from './utils/hash.util';

async function main() {
  console.info('seeding database...');

  console.info('creating grades...');
  const grades = await Promise.all([
    prisma.grade.upsert({
      where: { name: 'Débutant' },
      update: { xpRequired: 0 },
      create: { name: 'Débutant', xpRequired: 0 },
    }),
    prisma.grade.upsert({
      where: { name: 'Apprenti' },
      update: { xpRequired: 50 },
      create: { name: 'Apprenti', xpRequired: 50 },
    }),
    prisma.grade.upsert({
      where: { name: 'Confirmé' },
      update: { xpRequired: 150 },
      create: { name: 'Confirmé', xpRequired: 150 },
    }),
    prisma.grade.upsert({
      where: { name: 'Expert' },
      update: { xpRequired: 500 },
      create: { name: 'Expert', xpRequired: 500 },
    }),
    prisma.grade.upsert({
      where: { name: 'Maître' },
      update: { xpRequired: 1000 },
      create: { name: 'Maître', xpRequired: 1000 },
    }),
    prisma.grade.upsert({
      where: { name: 'Légende' },
      update: { xpRequired: 5000 },
      create: { name: 'Légende', xpRequired: 5000 },
    }),
  ]);
  console.info(`${grades.length} grades created`);

  console.info('creating badges...');
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { code: 'FIRST_TIP' },
      update: {},
      create: {
        code: 'FIRST_TIP',
        name: 'Premier pas',
        description: 'Créer ton premier tip',
        icon: '🎉',
        xpReward: 5,
      },
    }),
    prisma.badge.upsert({
      where: { code: 'TIP_MASTER' },
      update: {},
      create: {
        code: 'TIP_MASTER',
        name: 'Expert',
        description: 'Créer 50 tips',
        icon: '🏆',
        xpReward: 50,
      },
    }),
    prisma.badge.upsert({
      where: { code: 'TIP_LEGEND' },
      update: {},
      create: {
        code: 'TIP_LEGEND',
        name: 'Légende',
        description: 'Créer 200 tips',
        icon: '👑',
        xpReward: 200,
      },
    }),
    prisma.badge.upsert({
      where: { code: 'HELPFUL' },
      update: {},
      create: {
        code: 'HELPFUL',
        name: 'Serviable',
        description: 'Recevoir 100 upvotes',
        icon: '❤️',
        xpReward: 30,
      },
    }),
    prisma.badge.upsert({
      where: { code: 'SUPER_HELPFUL' },
      update: {},
      create: {
        code: 'SUPER_HELPFUL',
        name: 'Super Serviable',
        description: 'Recevoir 500 upvotes',
        icon: '💎',
        xpReward: 100,
      },
    }),
    prisma.badge.upsert({
      where: { code: 'SOCIAL' },
      update: {},
      create: {
        code: 'SOCIAL',
        name: 'Social',
        description: 'Avoir 10 followers',
        icon: '⭐',
        xpReward: 20,
      },
    }),
    prisma.badge.upsert({
      where: { code: 'INFLUENCER' },
      update: {},
      create: {
        code: 'INFLUENCER',
        name: 'Influenceur',
        description: 'Avoir 100 followers',
        icon: '🌟',
        xpReward: 100,
      },
    }),
    prisma.badge.upsert({
      where: { code: 'COMMENTATOR' },
      update: {},
      create: {
        code: 'COMMENTATOR',
        name: 'Commentateur',
        description: 'Écrire 50 commentaires',
        icon: '💬',
        xpReward: 30,
      },
    }),
    prisma.badge.upsert({
      where: { code: 'EARLY_BIRD' },
      update: {},
      create: {
        code: 'EARLY_BIRD',
        name: 'Early Bird',
        description: 'Membre des 30 premiers jours',
        icon: '🐦',
        xpReward: 50,
      },
    }),
  ]);
  console.info(`${badges.length} badges created`);

  // categories
  console.info('creating categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Technologie' },
      update: {},
      create: { name: 'Technologie', description: 'Tips tech et informatique' },
    }),
    prisma.category.upsert({
      where: { name: 'Cuisine' },
      update: {},
      create: { name: 'Cuisine', description: 'Recettes et astuces culinaires' },
    }),
    prisma.category.upsert({
      where: { name: 'Santé' },
      update: {},
      create: { name: 'Santé', description: 'Bien-être et santé' },
    }),
    prisma.category.upsert({
      where: { name: 'Éducation' },
      update: {},
      create: { name: 'Éducation', description: 'Apprentissage et formation' },
    }),
    prisma.category.upsert({
      where: { name: 'Finance' },
      update: {},
      create: { name: 'Finance', description: 'Argent et investissement' },
    }),
  ]);
  console.info(`${categories.length} categories created`);

  // utilisateurs test
  console.info('creating test users...');

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tipstop.com' },
    update: {},
    create: {
      username: 'admin',
      firstname: 'Admin',
      lastname: 'Principal',
      email: 'admin@tipstop.com',
      password: hashPassword('Admin123!'),
      xp: 10000,
      gradeId: grades[5].id, // Légende
    },
  });
  await prisma.admin.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });
  console.info(`admin created: admin@tipstop.com / Admin123!`);

  // Modérateur
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@tipstop.com' },
    update: {},
    create: {
      username: 'moderator',
      firstname: 'Modo',
      lastname: 'Actif',
      email: 'moderator@tipstop.com',
      password: hashPassword('Modo123!'),
      xp: 1500,
      gradeId: grades[4].id, // Maître
    },
  });
  await prisma.moderator.upsert({
    where: { userId: moderator.id },
    update: {},
    create: { userId: moderator.id, isActive: true },
  });
  console.info(`moderator created: moderator@tipstop.com / Modo123!`);

  // Utilisateurs normaux
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        username: 'alice',
        firstname: 'Alice',
        lastname: 'Martin',
        email: 'alice@example.com',
        password: hashPassword('Alice123!'),
        xp: 250,
        gradeId: grades[2].id, // Confirmé
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        username: 'bob',
        firstname: 'Bob',
        lastname: 'Durant',
        email: 'bob@example.com',
        password: hashPassword('Bob123!'),
        xp: 75,
        gradeId: grades[1].id, // Apprenti
      },
    }),
    prisma.user.upsert({
      where: { email: 'charlie@example.com' },
      update: {},
      create: {
        username: 'charlie',
        firstname: 'Charlie',
        lastname: 'Dubois',
        email: 'charlie@example.com',
        password: hashPassword('Charlie123!'),
        xp: 15,
        gradeId: grades[0].id, // Débutant
      },
    }),
  ]);
  console.info(`${users.length} regular users created`);

  // tips test
  console.info('creating test tips...');

  const tipData = [
    {
      title: 'Comment bien débuter avec Git ?',
      content:
        'Git est un système de contrôle de version essentiel. Commencez par `git init` pour initialiser un repo, `git add .` pour ajouter vos fichiers, et `git commit -m "message"` pour enregistrer vos changements.',
      userId: users[0].id,
      categoryId: categories[0].id,
      status: 'APPROVED',
    },
    {
      title: 'Astuces pour économiser sur les courses',
      content:
        "Planifiez vos repas à l'avance, faites une liste de courses et achetez en vrac quand c'est possible. Évitez de faire vos courses quand vous avez faim !",
      userId: users[1].id,
      categoryId: categories[4].id,
      status: 'APPROVED',
    },
    {
      title: 'Routine matinale pour être productif',
      content:
        "Réveillez-vous à heure fixe, hydratez-vous, faites 10 minutes d'exercice et prenez un petit-déjeuner équilibré. Évitez les écrans pendant la première heure.",
      userId: users[0].id,
      categoryId: categories[2].id,
      status: 'APPROVED',
    },
    {
      title: 'Recette rapide : Pâtes carbonara authentiques',
      content:
        "Ingrédients : pâtes, œufs, parmesan, guanciale (ou lardons), poivre. Astuce : mélangez les œufs hors du feu pour éviter qu'ils ne cuisent trop !",
      userId: users[1].id,
      categoryId: categories[1].id,
      status: 'APPROVED',
    },
    {
      title: 'Comment apprendre une nouvelle langue rapidement',
      content:
        'Immersion totale : regardez des séries en VO, utilisez des apps comme Duolingo, pratiquez 30 min par jour, et trouvez un partenaire linguistique.',
      userId: users[2].id,
      categoryId: categories[3].id,
      status: 'APPROVED',
    },
    {
      title: 'Tip en attente de modération',
      content: "Ce tip n'est pas encore validé par un modérateur.",
      userId: users[2].id,
      categoryId: categories[0].id,
      status: 'PENDING',
    },
    {
      title: 'Optimiser ses performances TypeScript',
      content:
        'Utilisez `const` au lieu de `let` quand possible, activez `strict: true`, et utilisez des types explicites pour éviter `any`.',
      userId: admin.id,
      categoryId: categories[0].id,
      status: 'APPROVED',
    },
    {
      title: 'Les meilleurs outils pour le télétravail',
      content:
        "Slack pour la communication, Notion pour l'organisation, Zoom pour les visios, et un bon casque antibruit.",
      userId: moderator.id,
      categoryId: categories[0].id,
      status: 'APPROVED',
    },
  ];

  for (const data of tipData) {
    await prisma.tip.create({
      data: {
        title: data.title,
        content: data.content,
        status: data.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        user: { connect: { id: data.userId } },
        categories: {
          create: {
            category: { connect: { id: data.categoryId } },
          },
        },
      },
    });
  }
  console.info(`${tipData.length} tips created`);

  console.info('\nseeding complete');
  console.info('\ntest accounts:');
  console.info('  Admin:     admin@tipstop.com / Admin123!');
  console.info('  Moderator: moderator@tipstop.com / Modo123!');
  console.info('  User 1:    alice@example.com / Alice123!');
  console.info('  User 2:    bob@example.com / Bob123!');
  console.info('  User 3:    charlie@example.com / Charlie123!');
}

main()
  .catch((e) => {
    console.error('seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
