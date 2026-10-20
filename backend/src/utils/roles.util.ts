import { prisma } from '../db/prisma';

// Modérateur actif ou administrateur
export async function isStaff(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { moderator: { select: { isActive: true } }, admin: { select: { userId: true } } },
  });
  return !!user && (!!user.admin || !!user.moderator?.isActive);
}
