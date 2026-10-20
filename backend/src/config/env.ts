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

const MIN_SECRET_LENGTH = 32;

// En production, un secret d'exemple (« change_me ») ou trop court permettrait de forger des jetons
function getSecret(key: string, testFallback: string): string {
  const value = getRequiredEnv(key, isTest ? testFallback : undefined);
  if (isProduction && (value.includes('change_me') || value.length < MIN_SECRET_LENGTH)) {
    throw new Error(
      `${key} must be a random value of at least ${MIN_SECRET_LENGTH} characters in production`,
    );
  }
  return value;
}

export const env = {
  PORT: process.env.PORT || 4000,
  DATABASE_URL: getRequiredEnv('DATABASE_URL'),
  JWT_SECRET: getSecret('JWT_SECRET', 'test-secret'),
  REFRESH_SECRET: getSecret('REFRESH_SECRET', 'test-refresh-secret'),
  HOST: process.env.HOST || 'localhost',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};
