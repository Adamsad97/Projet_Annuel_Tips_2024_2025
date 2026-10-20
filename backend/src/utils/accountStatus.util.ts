import { prisma } from '../db/prisma';
import { AppError } from './appError.util';

interface SanctionFields {
  bannedAt: Date | null;
  bannedUntil: Date | null;
  mutedUntil: Date | null;
}

// Ban actif : bannedAt renseigné et pas de date de fin (définitif) ou date de fin future
export const isBanned = (user: SanctionFields, now = new Date()): boolean =>
  !!user.bannedAt && (!user.bannedUntil || user.bannedUntil > now);

export const isMuted = (user: SanctionFields, now = new Date()): boolean =>
  !!user.mutedUntil && user.mutedUntil > now;

export const formatSanctionEnd = (date: Date | null): string =>
  date ? `jusqu'au ${date.toLocaleDateString('fr-FR')}` : 'définitivement';

// Bloque la publication de contenu (tips, commentaires, messages) pour un compte banni ou muet
export async function assertCanParticipate(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bannedAt: true, bannedUntil: true, mutedUntil: true },
  });

  if (!user) {
    throw new AppError('user not found', 404);
  }

  if (isBanned(user)) {
    throw new AppError(`account banned ${formatSanctionEnd(user.bannedUntil)}`, 403);
  }

  if (isMuted(user)) {
    throw new AppError(
      `you are muted ${formatSanctionEnd(user.mutedUntil)} and cannot publish content`,
      403,
    );
  }
}
