import { z } from 'zod';

export const createAppealSchema = z.object({
  reason: z
    .string('reason is required')
    .trim()
    .min(10, 'reason must be at least 10 characters')
    .max(1000, 'reason must not exceed 1000 characters'),
});
