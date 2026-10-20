import crypto from 'crypto';
import type { FeatureFlag } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';

// Fonctionnalités expérimentales connues du code, avec leur valeur par défaut.
// Une nouvelle entrée ici apparaît automatiquement dans l'admin.
export const FEATURE_DEFINITIONS = {
  chatbot: {
    description: 'Assistant qui propose les tips les plus utiles pour un problème décrit',
  },
  trends_page: {
    description: 'Page Tendances (tips les plus populaires de la période)',
  },
} as const;

export type FeatureKey = keyof typeof FEATURE_DEFINITIONS;

export const isFeatureKey = (key: string): key is FeatureKey => key in FEATURE_DEFINITIONS;

// Groupe stable de 0 à 99 pour un membre et une fonctionnalité : un membre reste toujours
// dans le même groupe (A ou B) tant que le pourcentage ne change pas
export const rolloutBucket = (key: string, userId: number): number =>
  crypto.createHash('sha256').update(`${key}:${userId}`).digest().readUInt32BE(0) % 100;

export class FeatureService {
  // Crée en base les fonctionnalités déclarées dans le code mais pas encore enregistrées
  async ensureDefinitions(): Promise<FeatureFlag[]> {
    await prisma.featureFlag.createMany({
      data: Object.entries(FEATURE_DEFINITIONS).map(([key, definition]) => ({
        key,
        description: definition.description,
      })),
      skipDuplicates: true,
    });
    return prisma.featureFlag.findMany({
      where: { key: { in: Object.keys(FEATURE_DEFINITIONS) } },
      orderBy: { key: 'asc' },
    });
  }

  // Une fonctionnalité partiellement déployée n'est visible que des membres de son groupe ;
  // les visiteurs ne la voient que si elle est déployée à 100 %
  isEnabledFor(flag: Pick<FeatureFlag, 'key' | 'enabled' | 'rolloutPercentage'>, userId?: number) {
    if (!flag.enabled) return false;
    if (flag.rolloutPercentage >= 100) return true;
    if (!userId) return false;
    return rolloutBucket(flag.key, userId) < flag.rolloutPercentage;
  }

  async getFeaturesFor(userId?: number): Promise<Record<FeatureKey, boolean>> {
    const flags = await this.ensureDefinitions();
    return Object.fromEntries(
      flags.map((flag) => [flag.key, this.isEnabledFor(flag, userId)]),
    ) as Record<FeatureKey, boolean>;
  }

  async isEnabled(key: FeatureKey, userId?: number): Promise<boolean> {
    return (await this.getFeaturesFor(userId))[key];
  }

  // Bloque une route quand la fonctionnalité est désactivée pour ce membre
  async assertEnabled(key: FeatureKey, userId?: number): Promise<void> {
    if (!(await this.isEnabled(key, userId))) {
      throw new AppError('this feature is not available', 404);
    }
  }

  // Vue admin : chaque fonctionnalité avec la taille réelle du groupe exposé
  async listForAdmin() {
    const [flags, users] = await Promise.all([
      this.ensureDefinitions(),
      prisma.user.findMany({ select: { id: true } }),
    ]);

    return flags.map((flag) => ({
      ...flag,
      exposedUsers: users.filter((user) => this.isEnabledFor(flag, user.id)).length,
      totalUsers: users.length,
    }));
  }

  async update(key: string, data: { enabled?: boolean; rolloutPercentage?: number }) {
    if (!isFeatureKey(key)) {
      throw new AppError('unknown feature', 404);
    }
    await this.ensureDefinitions();
    return prisma.featureFlag.update({ where: { key }, data });
  }
}

export const featureService = new FeatureService();
