// prismaClient.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Charge les variables d'environnement depuis le fichier .env
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "La variable d'environnement DATABASE_URL n'est pas définie dans le fichier .env",
  );
}

// Création du client Prisma avec adaptateur pour Prisma 7
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

// Gestion propre des erreurs et déconnexion
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', async (err) => {
  console.error('Erreur non capturée:', err);
  await prisma.$disconnect();
  process.exit(1);
});
