import { prisma } from '../db/prisma';

export async function clearUsers() {
  await prisma.user.deleteMany();
}

export async function clearTips() {
  await prisma.tip.deleteMany();
}

export async function clearModerationData() {
  await prisma.moderationAction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.moderator.deleteMany();
  await prisma.admin.deleteMany();
}

export async function seedBadges(): Promise<void> {
  const badges = [
    {
      code: 'FIRST_TIP',
      name: 'Premier pas',
      description: 'Créer ton premier tip',
      icon: '🎉',
      xpReward: 5,
    },
    {
      code: 'TIP_MASTER',
      name: 'Maître des tips',
      description: 'Créer 50 tips',
      icon: '🏆',
      xpReward: 50,
    },
    {
      code: 'TIP_LEGEND',
      name: 'Légende',
      description: 'Créer 200 tips',
      icon: '👑',
      xpReward: 100,
    },
    {
      code: 'HELPFUL',
      name: 'Utile',
      description: 'Recevoir 100 upvotes',
      icon: '👍',
      xpReward: 30,
    },
    {
      code: 'SUPER_HELPFUL',
      name: 'Super utile',
      description: 'Recevoir 500 upvotes',
      icon: '🌟',
      xpReward: 75,
    },
    {
      code: 'SOCIAL',
      name: 'Social',
      description: 'Avoir 10 followers',
      icon: '🤝',
      xpReward: 20,
    },
    {
      code: 'INFLUENCER',
      name: 'Influenceur',
      description: 'Avoir 50 followers',
      icon: '📱',
      xpReward: 50,
    },
    {
      code: 'COMMENTATOR',
      name: 'Commentateur',
      description: 'Écrire 50 commentaires',
      icon: '💬',
      xpReward: 25,
    },
    {
      code: 'EARLY_BIRD',
      name: 'Early bird',
      description: 'Membre depuis le début',
      icon: '🐣',
      xpReward: 10,
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {},
      create: badge,
    });
  }

  await prisma.grade.upsert({
      where: { name: 'Débutant' },
      update: { xpRequired: 0 },
      create: { name: 'Débutant', xpRequired: 0 },
    });
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
