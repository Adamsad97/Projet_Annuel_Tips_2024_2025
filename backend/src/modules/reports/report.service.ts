import type { Report } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { tipService } from '../tips/tip.service';

type ReportTarget = { tipId: number } | { commentId: number };

export class ReportService {
  async reportTip(tipId: number, userId: number, reason: string): Promise<Report> {
    const tip = await tipService.getPublishedTipOrThrow(tipId);

    return this.createReport({ tipId }, tip.userId, userId, reason);
  }

  async reportComment(commentId: number, userId: number, reason: string): Promise<Report> {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw new AppError('comment not found', 404);
    }

    return this.createReport({ commentId }, comment.userId, userId, reason);
  }

  private async createReport(
    target: ReportTarget,
    ownerId: number,
    userId: number,
    reason: string,
  ): Promise<Report> {
    if (ownerId === userId) {
      throw new AppError('you cannot report your own content', 403);
    }

    const alreadyReported = await prisma.report.findFirst({
      where: { ...target, userId, status: 'OPEN' },
    });

    if (alreadyReported) {
      throw new AppError('you have already reported this content', 409);
    }

    return prisma.report.create({ data: { ...target, userId, reason } });
  }
}

export const reportService = new ReportService();
