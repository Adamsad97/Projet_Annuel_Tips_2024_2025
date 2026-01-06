import { hashPassword, comparePassword } from '../../../utils/hash.util';

describe('hash.util', () => {
  it('should hash a password and compare successfully', async () => {
    const password = 'myP@ssw0rd';
    const hashed = await hashPassword(password);
    expect(typeof hashed).toBe('string');
    const isMatch = await comparePassword(password, hashed);
    expect(isMatch).toBe(true);
  });

  it('should return false for wrong password', async () => {
    const password = 'correct';
    const hashed = await hashPassword(password);
    const isMatch = await comparePassword('wrong', hashed);
    expect(isMatch).toBe(false);
  });
});
