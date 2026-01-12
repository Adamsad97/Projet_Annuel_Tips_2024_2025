import { signToken, verifyToken } from '../../../utils/jwt.util';

describe('jwt.util', () => {
  it('signe et verifie token', () => {
    const payload = { sub: '123', role: 'user' };
    const token = signToken(payload);
    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    
    if (decoded && typeof decoded === 'object') {
      expect('sub' in decoded && decoded.sub).toBe(payload.sub);
    }
  });

  it('erreur pour token invalide', () => {
    expect(() => verifyToken('not-a-token')).toThrow();
  });
});
