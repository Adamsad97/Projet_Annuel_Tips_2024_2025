import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), quiet: true });

process.env.NODE_ENV = 'test';
// Les règles de gamification (seuil d'XP, quotas) sont testées dans gamification.integration.test.ts
process.env.GAMIFICATION_ENFORCE = 'false';

// Le schéma de la base de test est appliqué avant les tests (prisma migrate deploy :
// script backend:test, job CI). Aucun reset automatique ici, pour ne jamais vider une
// base par erreur si DATABASE_URL pointe ailleurs.

jest.mock('bcrypt', () => ({
  compareSync: jest.fn((a: string, b: string) => `hashed:${a}` === b),
  genSaltSync: jest.fn(() => 10),
  hashSync: jest.fn((p: string) => `hashed:${p}`),
}));
