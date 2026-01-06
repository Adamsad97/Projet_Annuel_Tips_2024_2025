import { z } from 'zod';

export const createTipSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
});

export const updateTipSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(10).optional(),
});

export const getTipsQuerySchema = z.object({
  q: z.string().optional().or(z.literal(undefined)),
  skip: z.coerce.number().min(0).optional().or(z.literal(undefined)),
  take: z.coerce.number().min(1).max(100).optional().or(z.literal(undefined)),
});

export type CreateTipDto = z.infer<typeof createTipSchema>;
export type UpdateTipDto = z.infer<typeof updateTipSchema>;
export type GetTipsQuery = z.infer<typeof getTipsQuerySchema>;
