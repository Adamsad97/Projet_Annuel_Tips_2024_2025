import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { isBanned, isMuted } from '../../utils/accountStatus.util';
import { notificationService } from '../notifications/notification.service';
import { SANCTION_ACTIONS, TRUST_BASE, TRUST_RULES, TRUST_WEIGHTS as W } from './trust.config';

const DAY_MS = 24 * 60 * 60 * 1000;

// Courbe de saturation : 0 -> 0, half -> 0.5, tend vers 1
const saturate = (value: number, half: number) => (value <= 0 ? 0 : value / (value + half));
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);

export interface TrustFactor {
  key: string;
  label: string;
  value: number;
  points: number;
}

export interface TrustBreakdown {
  userId: number;
  computed: number;
  adjustment: number;
  trustIndex: number;
  factors: TrustFactor[];
}

export interface TrustCycleSummary {
  usersUpdated: number;
  promoted: number[];
  demoted: number[];
  watchlist: number[];
}

export class TrustService {
  // Détail du calcul pour un utilisateur (utilisé par l'admin pour comprendre / comparer)
  async computeBreakdown(userId: number): Promise<TrustBreakdown> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { moderator: true },
    });
    if (!user) {
      throw new AppError('user not found', 404);
    }

    const [
      publishedTips,
      votesOnTips,
      commentsWritten,
      commentsReceived,
      categories,
      actionsAgainst,
      falseReports,
      rejectedAppeals,
    ] = await Promise.all([
      prisma.tip.count({ where: { userId, status: 'APPROVED' } }),
      prisma.vote.groupBy({
        by: ['value'],
        where: { tip: { userId } },
        _count: { _all: true },
      }),
      prisma.comment.count({ where: { userId } }),
      prisma.comment.count({ where: { tip: { userId }, userId: { not: userId } } }),
      prisma.tipCategory.findMany({
        where: { tip: { userId, status: 'APPROVED' } },
        distinct: ['categoryId'],
        select: { categoryId: true },
      }),
      prisma.moderationAction.findMany({
        where: { userId, overturnedAt: null },
        select: { actionType: true },
      }),
      prisma.report.count({ where: { userId, status: 'REJECTED' } }),
      prisma.appeal.count({ where: { userId, status: 'REJECTED' } }),
    ]);

    const upvotes = votesOnTips.find((v) => v.value > 0)?._count._all ?? 0;
    const downvotes = votesOnTips.find((v) => v.value < 0)?._count._all ?? 0;
    const totalVotes = upvotes + downvotes;
    const countActions = (type: string) =>
      actionsAgainst.filter((a) => a.actionType === type).length;
    const seniorityDays = Math.floor((Date.now() - user.createdAt.getTime()) / DAY_MS);
    const loggedRecently =
      !!user.lastLoginAt && user.lastLoginAt >= daysAgo(W.recentLogin.withinDays);

    const factors: TrustFactor[] = [
      {
        key: 'publishedTips',
        label: 'Tips publiés',
        value: publishedTips,
        points: W.publishedTips.max * saturate(publishedTips, W.publishedTips.half),
      },
      {
        key: 'avgUpvotesPerTip',
        label: 'Votes « utile » moyens par tip',
        value: publishedTips ? round1(upvotes / publishedTips) : 0,
        points: publishedTips
          ? W.avgUpvotesPerTip.max * saturate(upvotes / publishedTips, W.avgUpvotesPerTip.half)
          : 0,
      },
      {
        key: 'voteRatio',
        label: 'Ratio utile / pas utile reçu',
        value: totalVotes ? round1((upvotes / totalVotes) * 100) : 0,
        // Neutre tant qu'il n'y a pas assez de votes pour juger
        points:
          totalVotes >= W.voteRatio.minVotes
            ? W.voteRatio.max * ((upvotes / totalVotes) * 2 - 1)
            : 0,
      },
      {
        key: 'commentsWritten',
        label: 'Commentaires écrits',
        value: commentsWritten,
        points: W.commentsWritten.max * saturate(commentsWritten, W.commentsWritten.half),
      },
      {
        key: 'commentsReceived',
        label: 'Commentaires reçus sur ses tips',
        value: commentsReceived,
        points: W.commentsReceived.max * saturate(commentsReceived, W.commentsReceived.half),
      },
      {
        key: 'categoryDiversity',
        label: 'Catégories différentes',
        value: categories.length,
        points: W.categoryDiversity.max * saturate(categories.length, W.categoryDiversity.half),
      },
      {
        key: 'seniorityDays',
        label: 'Ancienneté (jours)',
        value: seniorityDays,
        points: W.seniorityDays.max * saturate(seniorityDays, W.seniorityDays.half),
      },
      {
        key: 'recentLogin',
        label: `Connexion dans les ${W.recentLogin.withinDays} derniers jours`,
        value: loggedRecently ? 1 : 0,
        points: loggedRecently ? W.recentLogin.points : 0,
      },
      {
        key: 'removedContent',
        label: 'Contenus retirés après signalement',
        value: countActions('RESOLVE_REPORT_REJECT'),
        points: -Math.min(
          W.removedContent.cap,
          countActions('RESOLVE_REPORT_REJECT') * W.removedContent.perItem,
        ),
      },
      {
        key: 'rejectedTips',
        label: 'Tips refusés à la validation',
        value: countActions('REJECT_TIP'),
        points: -Math.min(W.rejectedTips.cap, countActions('REJECT_TIP') * W.rejectedTips.perItem),
      },
      {
        key: 'sanctions',
        label: 'Sanctions (avertissements, rétrogradations, mute, ban)',
        value: actionsAgainst.filter((a) => SANCTION_ACTIONS.includes(a.actionType)).length,
        points: -Math.min(
          W.sanctions.cap!,
          actionsAgainst.reduce((total, a) => total + (W.sanctions[a.actionType] ?? 0), 0),
        ),
      },
      {
        key: 'falseReports',
        label: 'Signalements abusifs',
        value: falseReports,
        points: -W.falseReports.max * saturate(falseReports, W.falseReports.half),
      },
      {
        key: 'rejectedAppeals',
        label: 'Contestations rejetées',
        value: rejectedAppeals,
        points: -Math.min(W.rejectedAppeals.cap, rejectedAppeals * W.rejectedAppeals.perItem),
      },
    ];

    if (user.moderator?.isActive) {
      factors.push(...(await this.moderatorFactors(userId)));
    }

    const rounded = factors.map((factor) => ({ ...factor, points: round1(factor.points) }));
    const computed = Math.round(
      clamp(TRUST_BASE + rounded.reduce((total, factor) => total + factor.points, 0)),
    );

    return {
      userId,
      computed,
      adjustment: user.trustAdjustment,
      trustIndex: clamp(computed + user.trustAdjustment),
      factors: rounded,
    };
  }

  async recomputeUser(userId: number): Promise<number> {
    const { trustIndex } = await this.computeBreakdown(userId);
    await prisma.user.update({
      where: { id: userId },
      data: { trustIndex, trustUpdatedAt: new Date() },
    });
    return trustIndex;
  }

  // Ajustement manuel : on mémorise l'écart avec le calcul pour qu'il survive aux recalculs
  async setManualTrustIndex(userId: number, target: number) {
    const { computed } = await this.computeBreakdown(userId);
    const trustAdjustment = target - computed;

    await prisma.user.update({
      where: { id: userId },
      data: {
        trustIndex: clamp(computed + trustAdjustment),
        trustAdjustment,
        trustUpdatedAt: new Date(),
      },
    });
    return { computed, trustAdjustment };
  }

  // Cycle complet : recalcul de tous les indices puis promotions / rétrogradations automatiques
  async runCycle(): Promise<TrustCycleSummary> {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const { id } of users) {
      await this.recomputeUser(id);
    }

    const { promoted, demoted } = await this.applyAutomaticRoles();
    const watchlist = (await this.getModeratorWatchlist()).map((entry) => entry.id);

    return { usersUpdated: users.length, promoted, demoted, watchlist };
  }

  async applyAutomaticRoles() {
    const promoted: number[] = [];
    const demoted: number[] = [];
    const rules = TRUST_RULES;

    if (rules.autoPromotion.enabled) {
      const candidates = await prisma.user.findMany({
        where: {
          trustIndex: { gte: rules.autoPromotion.minTrust },
          xp: { gte: rules.autoPromotion.minXp },
          createdAt: { lte: daysAgo(rules.autoPromotion.minAccountAgeDays) },
          admin: null,
          OR: [{ moderator: null }, { moderator: { isActive: false } }],
        },
        include: { _count: { select: { tips: { where: { status: 'APPROVED' } } } } },
      });

      for (const user of candidates) {
        if (
          user._count.tips < rules.autoPromotion.minPublishedTips ||
          isBanned(user) ||
          isMuted(user)
        ) {
          continue;
        }
        await prisma.moderator.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: { isActive: true },
        });
        await this.logSystemAction(user.id, 'AUTO_PROMOTE', 'Indice de confiance élevé');
        await notificationService.notify(user.id, {
          type: 'MODERATION',
          title: 'Félicitations, vous êtes maintenant modérateur !',
          body: 'Votre activité et la qualité de vos contributions vous ont valu ce rôle.',
          link: '/moderation',
        });
        promoted.push(user.id);
      }
    }

    const failingModerators = await prisma.moderator.findMany({
      where: {
        isActive: true,
        user: { trustIndex: { lt: rules.moderators.autoDemoteBelow }, admin: null },
      },
    });
    for (const moderator of failingModerators) {
      await prisma.moderator.update({
        where: { userId: moderator.userId },
        data: { isActive: false },
      });
      await this.logSystemAction(moderator.userId, 'AUTO_DEMOTE', 'Indice de confiance trop bas');
      await notificationService.notify(moderator.userId, {
        type: 'MODERATION',
        title: 'Vous n’êtes plus modérateur',
        body: 'Votre indice de fiabilité est passé sous le seuil requis.',
        link: '/my-moderation',
      });
      demoted.push(moderator.userId);
    }

    return { promoted, demoted };
  }

  // Rétrogradation assistée : modérateurs fragiles ou inactifs, à examiner par un admin
  async getModeratorWatchlist() {
    const { watchBelow } = TRUST_RULES.moderators;
    const since = daysAgo(W.moderatorInactivity.periodDays);

    const moderators = await prisma.user.findMany({
      where: { moderator: { isActive: true }, admin: null },
      select: {
        id: true,
        username: true,
        trustIndex: true,
        _count: {
          select: { moderationActionsDone: { where: { createdAt: { gte: since } } } },
        },
      },
    });

    return moderators
      .map((moderator) => ({
        id: moderator.id,
        username: moderator.username,
        trustIndex: moderator.trustIndex,
        recentActions: moderator._count.moderationActionsDone,
        reasons: [
          ...(moderator.trustIndex < watchBelow ? ['Indice de confiance faible'] : []),
          ...(moderator._count.moderationActionsDone === 0
            ? [`Aucune action depuis ${W.moderatorInactivity.periodDays} jours`]
            : []),
        ],
      }))
      .filter((moderator) => moderator.reasons.length > 0);
  }

  // Classement pour comparer les indices (plus fiables et moins fiables)
  async getRanking(limit = 10) {
    const select = { id: true, username: true, trustIndex: true, xp: true } as const;
    const [highest, lowest] = await Promise.all([
      prisma.user.findMany({ select, orderBy: { trustIndex: 'desc' }, take: limit }),
      prisma.user.findMany({ select, orderBy: { trustIndex: 'asc' }, take: limit }),
    ]);
    return { highest, lowest };
  }

  private async moderatorFactors(userId: number): Promise<TrustFactor[]> {
    const [recentActions, totalActions, overturnedActions, lastMonthActions] = await Promise.all([
      prisma.moderationAction.count({
        where: {
          moderatorId: userId,
          createdAt: { gte: daysAgo(W.moderationActivity.periodDays) },
        },
      }),
      prisma.moderationAction.count({ where: { moderatorId: userId } }),
      prisma.moderationAction.count({
        where: { moderatorId: userId, overturnedAt: { not: null } },
      }),
      prisma.moderationAction.count({
        where: {
          moderatorId: userId,
          createdAt: { gte: daysAgo(W.moderatorInactivity.periodDays) },
        },
      }),
    ]);

    return [
      {
        key: 'moderationActivity',
        label: `Actions de modération (${W.moderationActivity.periodDays} jours)`,
        value: recentActions,
        points: W.moderationActivity.max * saturate(recentActions, W.moderationActivity.half),
      },
      {
        key: 'moderationErrors',
        label: 'Décisions annulées par un admin (%)',
        value: totalActions ? round1((overturnedActions / totalActions) * 100) : 0,
        points: totalActions ? -W.moderationErrors.max * (overturnedActions / totalActions) : 0,
      },
      {
        key: 'moderatorInactivity',
        label: `Inactif depuis ${W.moderatorInactivity.periodDays} jours`,
        value: lastMonthActions === 0 ? 1 : 0,
        points: lastMonthActions === 0 ? -W.moderatorInactivity.penalty : 0,
      },
    ];
  }

  private logSystemAction(userId: number, actionType: string, reason: string) {
    return prisma.moderationAction.create({
      data: { moderatorId: null, userId, actionType, reason },
    });
  }
}

export const trustService = new TrustService();
