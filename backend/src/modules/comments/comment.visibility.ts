import type { Prisma } from '@prisma/client';

// Un commentaire retiré par la modération (removedAt renseigné) reste en base pour pouvoir
// être restauré si la contestation est acceptée, mais il est invisible partout ailleurs :
// listes, compteurs, votes, signalements, badges, XP et indice de confiance.
// Ses réponses sont masquées avec lui (et réapparaissent avec lui).
export const VISIBLE_COMMENT = {
  removedAt: null,
  NOT: { parent: { is: { removedAt: { not: null } } } },
} satisfies Prisma.CommentWhereInput;
