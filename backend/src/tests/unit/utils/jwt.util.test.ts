import { signToken, verifyToken } from '../../../utils/jwt.util';

describe('jwt.util', () => {
  it('should sign and verify a token', () => {
    const payload = { sub: '123', role: 'user' };
    const token = signToken(payload);
    expect(typeof token).toBe('string');
    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    // token should contain our payload properties
    if (decoded && typeof decoded === 'object') {
      expect('sub' in decoded && decoded.sub).toBe(payload.sub);
    }
  });

  it('should throw for invalid token', () => {
    expect(() => verifyToken('not-a-token')).toThrow();
  });
});
