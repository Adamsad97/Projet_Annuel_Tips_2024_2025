import { z } from 'zod';

const contentSchema = z
  .string('Message is required')
  .trim()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message too long');

export const sendMessageSchema = z.object({
  recipientId: z.number('Recipient is required').int().positive(),
  content: contentSchema,
});

export const editMessageSchema = z.object({
  content: contentSchema,
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
