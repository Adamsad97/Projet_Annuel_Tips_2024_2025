import dotenv from 'dotenv';
dotenv.config({ quiet: true });

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function getRequiredEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;

  if (!value || (isProduction && fallback && value === fallback)) {
    throw new Error(`missing required env variable: ${key}`);
  }

  return value;
}

export const env = {
  PORT: process.env.PORT || 4000,
  DATABASE_URL: getRequiredEnv('DATABASE_URL'),
  JWT_SECRET: getRequiredEnv('JWT_SECRET', isTest ? 'test-secret' : undefined),
  REFRESH_SECRET: getRequiredEnv('REFRESH_SECRET', isTest ? 'test-refresh-secret' : undefined),
  HOST: process.env.HOST || 'localhost',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};
