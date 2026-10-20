import { z } from 'zod';

// Code à 6 chiffres de l'application, ou code de secours (xxxx-xxxx)
const codeSchema = z
  .string('Code is required')
  .trim()
  .min(6, 'Invalid code')
  .max(20, 'Invalid code');

export const enableTwoFactorSchema = z.object({
  code: codeSchema,
});

export const disableTwoFactorSchema = z.object({
  password: z.string('Password is required').min(1, 'Password is required'),
  code: codeSchema,
});

export const loginTwoFactorSchema = z.object({
  twoFactorToken: z.string('Two-factor token is required').min(1),
  code: codeSchema,
});

export type EnableTwoFactorInput = z.infer<typeof enableTwoFactorSchema>;
export type DisableTwoFactorInput = z.infer<typeof disableTwoFactorSchema>;
export type LoginTwoFactorInput = z.infer<typeof loginTwoFactorSchema>;
