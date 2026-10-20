import type { PrismaConfig } from 'prisma';
import dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './prisma/schema',
  // Historique versionné des changements de schéma (prisma migrate dev / deploy)
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
} satisfies PrismaConfig;
