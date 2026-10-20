import { z } from 'zod';

export const askSchema = z.object({
  question: z
    .string('question is required')
    .trim()
    .min(3, 'question must be at least 3 characters')
    .max(500, 'question must not exceed 500 characters'),
});

export const chatbotConfigSchema = z.object({
  greeting: z.string().trim().min(5).max(500).optional(),
  fallbackMessage: z.string().trim().min(5).max(500).optional(),
  contextNote: z
    .string()
    .trim()
    .max(500)
    .transform((value) => (value.length > 0 ? value : null))
    .optional(),
});

// Liens internes uniquement (pages du frontend)
const internalLink = z
  .string()
  .trim()
  .regex(/^\/[\w\-/?=&]*$/, 'link must be an internal path like /settings')
  .optional();

export const chatbotResponseSchema = z.object({
  keywords: z.array(z.string().trim().min(2).max(60)).min(1, 'at least one keyword').max(20),
  answer: z.string().trim().min(5).max(1000),
  link: internalLink,
  priority: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export const updateChatbotResponseSchema = z.object({
  keywords: z.array(z.string().trim().min(2).max(60)).min(1).max(20).optional(),
  answer: z.string().trim().min(5).max(1000).optional(),
  link: internalLink.nullable(),
  priority: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type ChatbotConfigInput = z.infer<typeof chatbotConfigSchema>;
export type ChatbotResponseInput = z.infer<typeof chatbotResponseSchema>;
