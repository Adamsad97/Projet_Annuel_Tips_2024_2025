import { prisma } from '../db/prisma';

export async function clearUsers() {
  await prisma.user.deleteMany();
}

export async function clearTips() {
  await prisma.tip.deleteMany();
}

export async function seedBadges(): Promise<void> {
  await prisma.badge.upsert({
    where: { code: 'FIRST_TIP' },
    update: {},
    create: {
      code: 'FIRST_TIP',
      name: 'Premier pas',
      description: 'Créer ton premier tip',
      icon: '🎉',
      xpReward: 5,
    },
  });
  
  await prisma.grade.upsert({
      where: { name: 'Débutant' },
      update: { xpRequired: 0 },
      create: { name: 'Débutant', xpRequired: 0 },
    });
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
