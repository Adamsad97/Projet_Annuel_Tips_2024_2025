import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';

const DAY_MS = 24 * 60 * 60 * 1000;
// Un membre est « actif » s'il s'est connecté sur cette période
const ACTIVE_MEMBER_DAYS = 30;
const CONTACT_MESSAGES_LIMIT = 200;

export type ContactStatus = 'open' | 'handled' | 'all';

export const platformService = {
  // Chiffres réels affichés sur la page « À propos »
  async getStats() {
    const activeSince = new Date(Date.now() - ACTIVE_MEMBER_DAYS * DAY_MS);
    const [tips, questions, members, activeMembers, categories] = await Promise.all([
      prisma.tip.count({ where: { status: 'APPROVED', kind: 'TIP' } }),
      prisma.tip.count({ where: { status: 'APPROVED', kind: 'QUESTION' } }),
      prisma.user.count({ where: { bannedAt: null } }),
      prisma.user.count({ where: { bannedAt: null, lastLoginAt: { gte: activeSince } } }),
      prisma.category.count(),
    ]);
    return {
      tips,
      questions,
      members,
      activeMembers,
      activeMemberDays: ACTIVE_MEMBER_DAYS,
      categories,
    };
  },

  // Paliers de grades réels (gérés par l'admin)
  listGrades() {
    return prisma.grade.findMany({
      select: { id: true, name: true, xpRequired: true },
      orderBy: { xpRequired: 'asc' },
    });
  },

  createContactMessage(data: { name: string; email: string; message: string }, userId?: number) {
    return prisma.contactMessage.create({ data: { ...data, userId: userId ?? null } });
  },

  listContactMessages(status: ContactStatus) {
    return prisma.contactMessage.findMany({
      where: status === 'all' ? {} : { handledAt: status === 'open' ? null : { not: null } },
      orderBy: { createdAt: 'desc' },
      take: CONTACT_MESSAGES_LIMIT,
    });
  },

  async setContactMessageHandled(id: number, handled: boolean) {
    await findContactMessageOrThrow(id);
    return prisma.contactMessage.update({
      where: { id },
      data: { handledAt: handled ? new Date() : null },
    });
  },

  async deleteContactMessage(id: number) {
    await findContactMessageOrThrow(id);
    await prisma.contactMessage.delete({ where: { id } });
  },
};

async function findContactMessageOrThrow(id: number) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) {
    throw new AppError('contact message not found', 404);
  }
  return message;
}
