import { z } from 'zod';

const reasonSchema = z
  .string('reason is required')
  .trim()
  .min(5, 'reason must be at least 5 characters')
  .max(500, 'reason must not exceed 500 characters');

// days absent = ban définitif (un mute exige une durée)
export const sanctionSchema = z.object({
  reason: reasonSchema,
  days: z.number().int().min(1).max(3650).optional(),
});

export const trustIndexSchema = z.object({
  trustIndex: z.number().int().min(0).max(100),
  reason: reasonSchema,
});

export const gradeSchema = z.object({
  name: z.string().trim().min(2).max(50),
  xpRequired: z.number().int().min(0),
});

export const updateGradeSchema = gradeSchema.partial();

export const badgeUpdateSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  description: z.string().trim().max(255).optional(),
  icon: z.string().trim().min(1).max(10).optional(),
  xpReward: z.number().int().min(0).max(10000).optional(),
});

export const resolveAppealSchema = z.object({
  decision: z.enum(['ACCEPTED', 'REJECTED']),
  response: z.string().trim().max(500).optional(),
});

export const listUsersQuerySchema = z.object({
  q: z.string().trim().optional(),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['recent', 'trust-asc', 'trust-desc']).optional(),
});

export const listLogsQuerySchema = z.object({
  source: z.enum(['server', 'client']).optional(),
  q: z.string().trim().optional(),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(50),
});

// olderThanDays = 0 : tout supprimer
export const purgeLogsQuerySchema = z.object({
  olderThanDays: z.coerce.number().int().min(0).max(3650).default(30),
});

export const featureUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
});

export const contactListQuerySchema = z.object({
  status: z.enum(['open', 'handled', 'all']).default('open'),
});

export const contactHandledSchema = z.object({
  handled: z.boolean(),
});

export type SanctionInput = z.infer<typeof sanctionSchema>;
export type TrustIndexInput = z.infer<typeof trustIndexSchema>;
export type GradeInput = z.infer<typeof gradeSchema>;
export type BadgeUpdateInput = z.infer<typeof badgeUpdateSchema>;
