import { z } from 'zod';

export const resolveReportSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], {
    message: 'action must be either approve or reject',
  }),
  reason: z.string().max(500, 'reason must not exceed 500 characters').optional(),
});

export const promoteUserSchema = z.object({
  userId: z.number({ message: 'user id is required' }).int().positive(),
  role: z.enum(['MODERATOR', 'ADMIN'], {
    message: 'role must be either moderator or admin',
  }),
});

export const demoteUserSchema = z.object({
  userId: z.number({ message: 'user id is required' }).int().positive(),
  reason: z.string().min(10, 'reason must be at least 10 characters').max(500),
});

export const rejectTipSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const updateTipStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'status must be either approved or rejected',
  }),
  reason: z.string().max(500).optional(),
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type PromoteUserInput = z.infer<typeof promoteUserSchema>;
export type DemoteUserInput = z.infer<typeof demoteUserSchema>;
export type RejectTipInput = z.infer<typeof rejectTipSchema>;
export type UpdateTipStatusInput = z.infer<typeof updateTipStatusSchema>;
