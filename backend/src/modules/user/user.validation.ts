import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters')
    .transform((val) => val.toLowerCase().trim()),

  password: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
