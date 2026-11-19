import { z } from 'zod';

export const verifyEmailSchema = z.object({
  token: z
    .string('token is required')
    .regex(/^[a-f0-9]{64}$/, 'invalid or expired verification link'),
});

export const resendVerificationSchema = z.object({
  email: z.string('Email is required').trim().toLowerCase().email('Invalid email format'),
});
