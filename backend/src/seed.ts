import { prisma } from './db/prisma';

async function main() {
  console.info('Seeding database...');

  const gradeName = 'Beginner';
  let grade = await prisma.grade.findFirst({ where: { name: gradeName } });
  if (!grade) {
    grade = await prisma.grade.create({ data: { name: gradeName, xpRequired: 0 } });
  }

  const user = await prisma.user.upsert({
    where: { email: 'seeduser@example.com' },
    update: { firstname: 'Seed', lastname: 'User' },
    create: {
      firstname: 'Seed',
      lastname: 'User',
      email: 'seeduser@example.com',
      password: 'changeme',
      gradeId: grade.id,
    },
  });

  const category = await prisma.category.upsert({
    where: { name: 'General' },
    update: { description: 'General tips' },
    create: { name: 'General', description: 'General tips' },
  });

  const tip = await prisma.tip.create({
    data: {
      title: 'Welcome tip',
      content: 'This is a seed tip to confirm the app is wired correctly.',
      user: { connect: { id: user.id } },
      categories: {
        create: [
          {
            category: { connect: { id: category.id } },
          },
        ],
      },
    },
  });

  console.info('Seed complete:', {
    grade: grade.id,
    user: user.id,
    category: category.id,
    tip: tip.id,
  });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
