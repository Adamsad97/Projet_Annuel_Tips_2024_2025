import { prisma } from '../db/prisma';

export async function clearUsers() {
  await prisma.user.deleteMany();
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
