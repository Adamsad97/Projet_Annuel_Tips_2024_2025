import { z } from 'zod';

const passwordSchema = z
  .string('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must not exceed 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters')
    .transform((val) => val.toLowerCase().trim()),

  password: passwordSchema,

  username: z
    .string('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, hyphens and underscores',
    )
    .transform((val) => val.trim()),

  firstname: z
    .string()
    .max(100, 'Firstname must not exceed 100 characters')
    .transform((val) => val.trim())
    .optional()
    .or(z.literal(undefined)),

  lastname: z
    .string()
    .max(100, 'Lastname must not exceed 100 characters')
    .transform((val) => val.trim())
    .optional()
    .or(z.literal(undefined)),
});

export const loginSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),

  password: z.string('Password is required').min(1, 'Password is required'),
});

// Champs vides ("") => valeur effacée (null)
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must not exceed ${max} characters`)
    .transform((val) => (val.length > 0 ? val : null))
    .optional();

export const updateProfileSchema = z.object({
  firstname: optionalText(100, 'Firstname'),
  lastname: optionalText(100, 'Lastname'),
  bio: optionalText(500, 'Bio'),
  address: optionalText(255, 'Address'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string('Current password is required')
      .min(1, 'Current password is required'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current one',
    path: ['newPassword'],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
