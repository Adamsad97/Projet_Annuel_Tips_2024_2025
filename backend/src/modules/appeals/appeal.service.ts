import type { AppealStatus, ModerationAction, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { notificationService } from '../notifications/notification.service';
import { xpService } from '../xp/xp.service';
import { trustService } from '../trust/trust.service';

// Actions défavorables à l'utilisateur, qu'il peut contester
export const CONTESTABLE_ACTIONS = [
  'WARN',
  'DOWNGRADE',
  'BAN',
  'MUTE',
  'REJECT_TIP',
  'RESOLVE_REPORT_REJECT',
];

const MY_MODERATION_LINK = '/my-moderation';

type ActionMetadata = {
  tipId?: number | null;
  previousXp?: number;
  previousGradeId?: number | null;
};

export class AppealService {
  // Sanctions reçues par l'utilisateur, avec l'état de leur éventuelle contestation
  async listMyActions(userId: number) {
    const actions = await prisma.moderationAction.findMany({
      where: { userId, actionType: { in: CONTESTABLE_ACTIONS } },
      include: { appeal: true },
      orderBy: { createdAt: 'desc' },
    });

    return actions.map((action) => ({
      id: action.id,
      actionType: action.actionType,
      reason: action.reason,
      createdAt: action.createdAt,
      overturnedAt: action.overturnedAt,
      appeal: action.appeal,
      canAppeal: !action.appeal && !action.overturnedAt,
    }));
  }

  async createAppeal(actionId: number, userId: number, reason: string) {
    const action = await prisma.moderationAction.findUnique({
      where: { id: actionId },
      include: { appeal: true },
    });

    if (!action || action.userId !== userId) {
      throw new AppError('moderation action not found', 404);
    }
    if (!CONTESTABLE_ACTIONS.includes(action.actionType)) {
      throw new AppError('this action cannot be contested', 400);
    }
    if (action.overturnedAt) {
      throw new AppError('this action has already been cancelled', 400);
    }
    if (action.appeal) {
      throw new AppError('this action has already been contested', 409);
    }

    return prisma.appeal.create({ data: { actionId, userId, reason } });
  }

  async listAppeals(status?: AppealStatus) {
    return prisma.appeal.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { id: true, username: true, firstname: true, lastname: true } },
        resolvedBy: { select: { id: true, username: true } },
        // moderator null = action automatique du système
        action: { include: { moderator: { select: { id: true, username: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async resolveAppeal(
    appealId: number,
    adminId: number,
    decision: 'ACCEPTED' | 'REJECTED',
    response?: string,
  ) {
    const appeal = await prisma.appeal.findUnique({
      where: { id: appealId },
      include: { action: true },
    });

    if (!appeal) {
      throw new AppError('appeal not found', 404);
    }
    if (appeal.status !== 'OPEN') {
      throw new AppError('appeal has already been resolved', 400);
    }

    if (decision === 'ACCEPTED') {
      await this.overturnAction(appeal.action);
    }

    const resolved = await prisma.appeal.update({
      where: { id: appealId },
      data: { status: decision, response, resolvedAt: new Date(), resolvedById: adminId },
    });

    setImmediate(() => {
      for (const userId of [appeal.userId, appeal.action.moderatorId]) {
        if (userId) trustService.recomputeUser(userId).catch(() => undefined);
      }
    });

    await notificationService.notify(appeal.userId, {
      type: 'MODERATION',
      title:
        decision === 'ACCEPTED'
          ? 'Votre contestation a été acceptée, la sanction est annulée'
          : 'Votre contestation a été refusée',
      body: response,
      link: MY_MODERATION_LINK,
    });

    return resolved;
  }

  // Annule les effets de l'action ; overturnedAt servira aussi au calcul de l'indice de confiance
  // du modérateur (sanction abusive annulée par un admin)
  private async overturnAction(action: ModerationAction) {
    const metadata = (action.metadata ?? {}) as ActionMetadata;
    const userUpdate: Prisma.UserUpdateInput = {};

    switch (action.actionType) {
      case 'BAN':
        Object.assign(userUpdate, { bannedAt: null, bannedUntil: null, banReason: null });
        break;
      case 'MUTE':
        userUpdate.mutedUntil = null;
        break;
      case 'DOWNGRADE':
        if (metadata.previousXp !== undefined) {
          userUpdate.xp = metadata.previousXp;
        }
        break;
      case 'REJECT_TIP':
        // Le tip repasse en file de validation
        if (metadata.tipId) {
          await prisma.tip.updateMany({
            where: { id: metadata.tipId },
            data: { status: 'PENDING' },
          });
        }
        break;
      case 'RESOLVE_REPORT_REJECT':
        if (metadata.tipId) {
          await prisma.tip.updateMany({
            where: { id: metadata.tipId },
            data: { status: 'APPROVED' },
          });
        }
        break;
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: action.userId }, data: userUpdate });
    }
    if (action.actionType === 'DOWNGRADE') {
      await xpService.checkGradePromotion(action.userId);
    }

    await prisma.moderationAction.update({
      where: { id: action.id },
      data: { overturnedAt: new Date() },
    });
  }
}

export const appealService = new AppealService();
