import { z } from 'zod';

export const createReportSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason must not exceed 500 characters'),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;
