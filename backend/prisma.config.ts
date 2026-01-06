import type { PrismaConfig } from 'prisma';
import dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './prisma/schema',
  datasource: {
    url: process.env.DATABASE_URL,
  },
} satisfies PrismaConfig;
