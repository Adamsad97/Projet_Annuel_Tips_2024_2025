import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { xpService } from '../xp/xp.service';
import { badgeService } from '../badges/badge.service';
import { XP_REWARDS, XpAction } from '../../types/xp.types';
import { tipService } from '../tips/tip.service';
import type { VoteValue } from './vote.validation';

export interface VoteSummary {
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteValue;
}

type VoteTarget = { tipId: number } | { commentId: number };

interface ApplyVoteParams {
  target: VoteTarget;
  ownerId: number;
  userId: number;
  value: VoteValue;
  upAction: XpAction;
  downAction?: XpAction;
}

const findUserVote = (target: VoteTarget, userId: number) =>
  'tipId' in target
    ? prisma.vote.findUnique({ where: { userId_tipId: { userId, tipId: target.tipId } } })
    : prisma.vote.findUnique({
        where: { userId_commentId: { userId, commentId: target.commentId } },
      });

export class VoteService {
  async voteOnTip(tipId: number, userId: number, value: VoteValue): Promise<VoteSummary> {
    const tip = await tipService.getPublishedTipOrThrow(tipId);

    return this.applyVote({
      target: { tipId },
      ownerId: tip.userId,
      userId,
      value,
      upAction: XpAction.TIP_UPVOTED,
      downAction: XpAction.TIP_DOWNVOTED,
    });
  }

  async voteOnComment(commentId: number, userId: number, value: VoteValue): Promise<VoteSummary> {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw new AppError('comment not found', 404);
    }

    return this.applyVote({
      target: { commentId },
      ownerId: comment.userId,
      userId,
      value,
      upAction: XpAction.COMMENT_UPVOTED,
    });
  }

  async getSummary(target: VoteTarget, userId?: number): Promise<VoteSummary> {
    const [upvotes, downvotes, userVote] = await Promise.all([
      prisma.vote.count({ where: { ...target, value: 1 } }),
      prisma.vote.count({ where: { ...target, value: -1 } }),
      userId ? findUserVote(target, userId) : null,
    ]);

    return {
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      userVote: (userVote?.value ?? 0) as VoteValue,
    };
  }

  private async applyVote(params: ApplyVoteParams): Promise<VoteSummary> {
    const { target, ownerId, userId, value, upAction, downAction } = params;

    if (ownerId === userId) {
      throw new AppError('you cannot vote on your own content', 403);
    }

    const existing = await findUserVote(target, userId);
    const previousValue = existing?.value ?? 0;

    if (previousValue !== value) {
      if (value === 0) {
        await prisma.vote.delete({ where: { id: existing!.id } });
      } else if (existing) {
        await prisma.vote.update({ where: { id: existing.id }, data: { value } });
      } else {
        await prisma.vote.create({ data: { ...target, userId, value } });
      }

      // L'XP de l'auteur suit l'état du vote : annuler ou inverser un vote reprend l'XP donnée,
      // ce qui empêche de farmer de l'XP en votant / dévotant en boucle.
      const xpFor = (v: number): number => {
        if (v > 0) return XP_REWARDS[upAction];
        if (v < 0 && downAction) return XP_REWARDS[downAction];
        return 0;
      };
      const xpDelta = xpFor(value) - xpFor(previousValue);

      if (xpDelta !== 0) {
        await xpService.addXp(ownerId, xpDelta > 0 ? upAction : (downAction ?? upAction), xpDelta);
      }

      if (value > 0) {
        await badgeService.checkAndAwardBadges(ownerId);
      }
    }

    return this.getSummary(target, userId);
  }
}

export const voteService = new VoteService();
