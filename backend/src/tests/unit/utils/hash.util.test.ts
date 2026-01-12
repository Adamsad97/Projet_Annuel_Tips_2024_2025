import { hashPassword, comparePassword } from '../../../utils/hash.util';

describe('hash.util', () => {
  it('hash et compare password correctement', async () => {
    const password = 'myP@ssw0rd';
    const hashed = await hashPassword(password);
    expect(typeof hashed).toBe('string');
    const isMatch = await comparePassword(password, hashed);
    expect(isMatch).toBe(true);
  });

  it('retourne false pour mauvais password', async () => {
    const password = 'correct';
    const hashed = await hashPassword(password);
    const isMatch = await comparePassword('wrong', hashed);
    expect(isMatch).toBe(false);
  });
});
