import { z } from 'zod';
import { TIP_IMAGE_PATH_REGEX } from '../tips/tip.validation';

const AD_IMAGE_PATH_REGEX = new RegExp(TIP_IMAGE_PATH_REGEX.source.replace('tips', 'ads'));

const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'invalid date',
});

// Lien sortant vers le partenaire : https uniquement
const httpsUrl = z
  .string()
  .trim()
  .url('invalid url')
  .refine((value) => value.startsWith('https://'), { message: 'url must use https' });

const campaignFields = z.object({
  name: z.string().trim().min(3).max(100),
  sponsorName: z.string().trim().min(2).max(100),
  title: z.string().trim().min(5).max(120),
  body: z.string().trim().min(10).max(500),
  imageUrl: z.string().regex(AD_IMAGE_PATH_REGEX, 'invalid image path').nullable().optional(),
  targetUrl: httpsUrl,
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).default('DRAFT'),
  audience: z.enum(['ALL', 'MEMBERS', 'GUESTS']).default('ALL'),
  targetCategoryIds: z.array(z.number().int().positive()).max(20).default([]),
  targetGradeIds: z.array(z.number().int().positive()).max(20).default([]),
  startsAt: dateString,
  endsAt: dateString.nullable().optional(),
  maxImpressions: z.number().int().min(1).nullable().optional(),
  priority: z.number().int().min(0).max(100).default(0),
});

const endsAfterStart = (data: { startsAt?: string; endsAt?: string | null }) =>
  !data.startsAt || !data.endsAt || Date.parse(data.endsAt) > Date.parse(data.startsAt);
const endsAfterStartMessage = { message: 'endsAt must be after startsAt', path: ['endsAt'] };

export const adCampaignSchema = campaignFields.refine(endsAfterStart, endsAfterStartMessage);

export const updateAdCampaignSchema = campaignFields
  .partial()
  .refine(endsAfterStart, endsAfterStartMessage);

export const challengeFields = z.object({
  sponsorName: z.string().trim().min(2).max(100),
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(500),
  categoryId: z.number().int().positive(),
  xpBonus: z.number().int().min(1).max(1000),
  startsAt: dateString,
  endsAt: dateString,
  maxRewards: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().default(true),
  campaignId: z.number().int().positive().nullable().optional(),
});

export const challengeSchema = challengeFields.refine(endsAfterStart, endsAfterStartMessage);

export const updateChallengeSchema = challengeFields
  .partial()
  .refine(endsAfterStart, endsAfterStartMessage);

export const placementQuerySchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  exclude: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? '')
        .split(',')
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
});

export type AdCampaignInput = z.infer<typeof adCampaignSchema>;
export type ChallengeInput = z.infer<typeof challengeSchema>;
