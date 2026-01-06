import dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../env/.env.test'), quiet: true });

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Optionally, run prisma migrate deploy against test DB before tests start
// (commented out by default because it requires prisma binary + db availability)
try {
  // Run migrations on test DB so schema exists before tests run
  execSync('npx prisma migrate deploy --schema=./prisma/schema/schema.prisma', {
    stdio: 'inherit',
    env: { ...process.env },
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_e) {
  // ignore during setup; migrations can be run manually in CI or via docker-compose
}

// Mock ESM-only dependencies which Jest can't transform from node_modules
// bcrypt-ts is provided as ESM; mock it so tests don't try to parse it
jest.mock('bcrypt-ts', () => ({
  compareSync: jest.fn((a: string, b: string) => `hashed:${a}` === b),
  genSaltSync: jest.fn(() => 10),
  hashSync: jest.fn((p: string) => `hashed:${p}`),
}));
