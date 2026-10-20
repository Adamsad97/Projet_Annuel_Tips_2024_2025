import { z } from 'zod';

export const TIP_IMAGE_PATH_REGEX = /^\/uploads\/tips\/[\w-]+\.(jpg|jpeg|png|webp|gif)$/;

const tipFieldsSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  categories: z.array(z.string().trim().min(1).max(50)).max(5, 'Maximum 5 categories').optional(),
  address: z.string().trim().max(255, 'Address too long').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  images: z
    .array(z.string().regex(TIP_IMAGE_PATH_REGEX, 'Invalid image path'))
    .max(5, 'Maximum 5 images')
    .optional(),
});

const hasBothOrNoCoordinates = (data: { latitude?: number; longitude?: number }): boolean =>
  (data.latitude === undefined) === (data.longitude === undefined);

const coordinatesMessage = {
  message: 'latitude and longitude must be provided together',
  path: ['latitude'],
};

export const createTipSchema = tipFieldsSchema.refine(hasBothOrNoCoordinates, coordinatesMessage);

export const updateTipSchema = tipFieldsSchema
  .partial()
  .refine(hasBothOrNoCoordinates, coordinatesMessage);

export const getTipsQuerySchema = z.object({
  q: z.string().optional().or(z.literal(undefined)),
  category: z.string().trim().min(1).optional(),
  located: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  skip: z.coerce.number().min(0).optional().or(z.literal(undefined)),
  take: z.coerce.number().min(1).max(100).optional().or(z.literal(undefined)),
});

export const trendingQuerySchema = z.object({
  days: z.coerce
    .number()
    .int()
    .refine((value) => [1, 7, 30].includes(value), {
      message: 'days must be 1, 7 or 30',
    })
    .default(7),
});

export type CreateTipDto = z.infer<typeof createTipSchema>;
export type UpdateTipDto = z.infer<typeof updateTipSchema>;
export type GetTipsQuery = z.infer<typeof getTipsQuerySchema>;
