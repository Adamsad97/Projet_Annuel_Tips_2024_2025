import { z } from 'zod';

const contentSchema = z
  .string()
  .trim()
  .min(2, 'Comment must be at least 2 characters')
  .max(2000, 'Comment too long');

export const createCommentSchema = z.object({
  content: contentSchema,
  parentId: z.number().int().positive().optional(),
});

export const updateCommentSchema = z.object({
  content: contentSchema,
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;
