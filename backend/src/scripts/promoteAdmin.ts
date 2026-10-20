import { prisma } from '../db/prisma';

// Donne le rôle administrateur à un compte déjà inscrit (premier admin d'une nouvelle installation).
// Usage : npm run admin:promote -- email@exemple.fr
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('usage: npm run admin:promote -- <email>');
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`no user with email ${email}: create the account first (sign up)`);
    process.exitCode = 1;
    return;
  }

  await prisma.admin.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  console.info(`${user.username} (${email}) is now an administrator`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
