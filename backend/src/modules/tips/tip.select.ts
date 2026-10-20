import type { Prisma } from '@prisma/client';

// Auteur affiché avec un tip : identité publique, XP, grade et rôle (jamais l'email)
export const tipAuthorSelect = {
  id: true,
  username: true,
  firstname: true,
  lastname: true,
  avatarProfile: true,
  xp: true,
  grade: { select: { name: true } },
  moderator: { select: { isActive: true } },
  admin: { select: { userId: true } },
} satisfies Prisma.UserSelect;
