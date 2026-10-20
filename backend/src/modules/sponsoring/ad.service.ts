import type { AdCampaign, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/appError.util';
import { removeUploadedFile } from '../../utils/imageUpload.util';
import type { AdCampaignInput } from './sponsoring.validation';

// Jour courant (UTC) pour l'agrégation des statistiques
const today = (): Date => new Date(new Date().toISOString().slice(0, 10));

export interface PlacementContext {
  userId?: number;
  categoryId?: number;
  // Campagnes déjà affichées sur la page, pour ne pas montrer deux fois la même
  excludeIds: number[];
}

// Champs exposés au public : jamais le ciblage, le budget ni les statistiques
const toPublicAd = (campaign: AdCampaign) => ({
  id: campaign.id,
  sponsorName: campaign.sponsorName,
  title: campaign.title,
  body: campaign.body,
  imageUrl: campaign.imageUrl,
});

export class AdService {
  // Choisit la campagne à afficher pour ce contexte et compte l'affichage
  async getPlacement(context: PlacementContext) {
    const now = new Date();
    const [campaigns, viewer] = await Promise.all([
      prisma.adCampaign.findMany({
        where: {
          status: 'ACTIVE',
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          id: { notIn: context.excludeIds },
          audience: context.userId ? { in: ['ALL', 'MEMBERS'] } : { in: ['ALL', 'GUESTS'] },
        },
        include: { stats: { select: { impressions: true } } },
        orderBy: { priority: 'desc' },
      }),
      context.userId
        ? prisma.user.findUnique({
            where: { id: context.userId },
            select: { gradeId: true, categoryFollows: { select: { categoryId: true } } },
          })
        : null,
    ]);

    // Catégories pertinentes : celle consultée, sinon celles suivies par le membre
    const relevantCategories = context.categoryId
      ? [context.categoryId]
      : (viewer?.categoryFollows.map((follow) => follow.categoryId) ?? []);

    const eligible = campaigns.filter((campaign) => {
      const impressions = campaign.stats.reduce((total, day) => total + day.impressions, 0);
      if (campaign.maxImpressions !== null && impressions >= campaign.maxImpressions) return false;

      if (
        campaign.targetCategoryIds.length > 0 &&
        !campaign.targetCategoryIds.some((id) => relevantCategories.includes(id))
      ) {
        return false;
      }

      if (campaign.targetGradeIds.length > 0) {
        if (!viewer?.gradeId || !campaign.targetGradeIds.includes(viewer.gradeId)) return false;
      }

      return true;
    });

    if (eligible.length === 0) return null;

    // Priorité la plus haute d'abord ; rotation aléatoire entre campagnes de même priorité
    const topPriority = eligible[0]!.priority;
    const candidates = eligible.filter((campaign) => campaign.priority === topPriority);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)]!;

    await this.increment(chosen.id, 'impressions');
    return toPublicAd(chosen);
  }

  // Compte le clic et renvoie l'URL du partenaire (redirection côté contrôleur)
  async registerClick(campaignId: number): Promise<string> {
    const campaign = await prisma.adCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new AppError('campaign not found', 404);
    }
    await this.increment(campaignId, 'clicks');
    return campaign.targetUrl;
  }

  // ---------- Administration ----------

  async list() {
    const campaigns = await prisma.adCampaign.findMany({
      include: { stats: true },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return campaigns.map(({ stats, ...campaign }) => ({
      ...campaign,
      totals: this.totals(stats),
    }));
  }

  create(data: AdCampaignInput) {
    return prisma.adCampaign.create({ data: this.toData(data) as Prisma.AdCampaignCreateInput });
  }

  async update(id: number, data: Partial<AdCampaignInput>) {
    const campaign = await this.findOrThrow(id);
    const updated = await prisma.adCampaign.update({ where: { id }, data: this.toData(data) });
    if (data.imageUrl !== undefined && campaign.imageUrl !== updated.imageUrl) {
      removeUploadedFile(campaign.imageUrl);
    }
    return updated;
  }

  async remove(id: number) {
    const campaign = await this.findOrThrow(id);
    await prisma.adCampaign.delete({ where: { id } });
    removeUploadedFile(campaign.imageUrl);
  }

  // Statistiques quotidiennes et totaux (affichages, clics, taux de clic)
  async getStats(id: number) {
    const campaign = await this.findOrThrow(id);
    const days = await prisma.adDailyStat.findMany({
      where: { campaignId: id },
      orderBy: { day: 'asc' },
    });

    return {
      campaign: { id: campaign.id, name: campaign.name, sponsorName: campaign.sponsorName },
      totals: this.totals(days),
      days: days.map((day) => ({
        day: day.day.toISOString().slice(0, 10),
        impressions: day.impressions,
        clicks: day.clicks,
        ctr: this.ctr(day.impressions, day.clicks),
      })),
    };
  }

  // Rapport CSV pour le partenaire (séparateur ; pour Excel en français)
  async getStatsCsv(id: number): Promise<{ filename: string; content: string }> {
    const stats = await this.getStats(id);
    const lines = [
      'jour;affichages;clics;taux_de_clic_%',
      ...stats.days.map((day) => `${day.day};${day.impressions};${day.clicks};${day.ctr}`),
      `total;${stats.totals.impressions};${stats.totals.clicks};${stats.totals.ctr}`,
    ];
    const slug = stats.campaign.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return {
      filename: `campagne-${stats.campaign.id}-${slug || 'stats'}.csv`,
      content: lines.join('\n'),
    };
  }

  private totals(days: Array<{ impressions: number; clicks: number }>) {
    const impressions = days.reduce((total, day) => total + day.impressions, 0);
    const clicks = days.reduce((total, day) => total + day.clicks, 0);
    return { impressions, clicks, ctr: this.ctr(impressions, clicks) };
  }

  private ctr(impressions: number, clicks: number): number {
    return impressions ? Math.round((clicks / impressions) * 10000) / 100 : 0;
  }

  private increment(campaignId: number, field: 'impressions' | 'clicks') {
    const day = today();
    return prisma.adDailyStat.upsert({
      where: { campaignId_day: { campaignId, day } },
      update: { [field]: { increment: 1 } },
      create: { campaignId, day, [field]: 1 },
    });
  }

  private toData(data: Partial<AdCampaignInput>): Prisma.AdCampaignUpdateInput {
    return {
      ...data,
      ...(data.startsAt ? { startsAt: new Date(data.startsAt) } : {}),
      ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
    };
  }

  private async findOrThrow(id: number) {
    const campaign = await prisma.adCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new AppError('campaign not found', 404);
    }
    return campaign;
  }
}

export const adService = new AdService();
