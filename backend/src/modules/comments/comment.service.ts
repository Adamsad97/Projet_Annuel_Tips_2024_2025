import type { Comment } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { xpService } from '../xp/xp.service';
import { badgeService } from '../badges/badge.service';
import { tipService } from '../tips/tip.service';
import { XpAction } from '../../types/xp.types';
import type { CreateCommentDto, UpdateCommentDto } from './comment.validation';

const commentAuthorSelect = {
  id: true,
  username: true,
  firstname: true,
  lastname: true,
  avatarProfile: true,
} as const;

export interface CommentView {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: number | null;
  user: {
    id: number;
    username: string;
    firstname: string | null;
    lastname: string | null;
    avatarProfile: string | null;
  };
  score: number;
  userVote: number;
  replies: CommentView[];
}

export class CommentService {
  async getTipComments(tipId: number, viewerId?: number): Promise<CommentView[]> {
    const tip = await prisma.tip.findUnique({ where: { id: tipId }, select: { id: true } });

    if (!tip) {
      throw new AppError('tip not found', 404);
    }

    const comments = await prisma.comment.findMany({
      where: { tipId },
      include: {
        user: { select: commentAuthorSelect },
        votes: { select: { userId: true, value: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const views = new Map<number, CommentView>();
    for (const comment of comments) {
      views.set(comment.id, {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        parentId: comment.parentId,
        user: comment.user,
        score: comment.votes.reduce((total, vote) => total + vote.value, 0),
        userVote: comment.votes.find((vote) => vote.userId === viewerId)?.value ?? 0,
        replies: [],
      });
    }

    // Commentaires racines du plus récent au plus ancien, réponses dans l'ordre chronologique
    const roots: CommentView[] = [];
    for (const view of views.values()) {
      const parent = view.parentId ? views.get(view.parentId) : undefined;
      if (parent) {
        parent.replies.push(view);
      } else {
        roots.unshift(view);
      }
    }

    return roots;
  }

  async createComment(tipId: number, userId: number, data: CreateCommentDto): Promise<Comment> {
    await tipService.getPublishedTipOrThrow(tipId);

    let parentId: number | undefined;
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: data.parentId } });

      if (!parent || parent.tipId !== tipId) {
        throw new AppError('parent comment not found on this tip', 400);
      }

      // Un seul niveau de réponses : répondre à une réponse rattache au commentaire racine
      parentId = parent.parentId ?? parent.id;
    }

    const comment = await prisma.comment.create({
      data: { content: data.content, tipId, userId, parentId },
      include: { user: { select: commentAuthorSelect } },
    });

    await xpService.addXp(userId, XpAction.COMMENT_CREATED);
    await badgeService.checkAndAwardBadges(userId);

    return comment;
  }

  async updateComment(id: number, userId: number, data: UpdateCommentDto): Promise<Comment> {
    await this.findOwnedCommentOrThrow(id, userId);

    return prisma.comment.update({
      where: { id },
      data: { content: data.content },
      include: { user: { select: commentAuthorSelect } },
    });
  }

  async deleteComment(id: number, userId: number): Promise<void> {
    await this.findOwnedCommentOrThrow(id, userId);
    await prisma.comment.delete({ where: { id } });
  }

  private async findOwnedCommentOrThrow(id: number, userId: number): Promise<Comment> {
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new AppError('comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('unauthorized to modify this comment', 403);
    }

    return comment;
  }
}

export const commentService = new CommentService();
