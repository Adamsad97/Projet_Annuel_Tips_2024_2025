import dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), quiet: true });

process.env.NODE_ENV = 'test';

// Reset test DB and apply migrations
try {
  execSync(
    'npx prisma migrate reset --force --skip-generate --schema=./prisma/schema/schema.prisma',
    {
      stdio: 'pipe',
      env: { ...process.env },
    },
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_e) {
  // Ignore if reset fails
}

jest.mock('bcrypt', () => ({
  compareSync: jest.fn((a: string, b: string) => `hashed:${a}` === b),
  genSaltSync: jest.fn(() => 10),
  hashSync: jest.fn((p: string) => `hashed:${p}`),
}));
