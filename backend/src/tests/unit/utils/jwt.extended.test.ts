import { createAccessToken, createRefreshToken } from '../../../utils/jwt.util';


describe('JWT Utils - Token Creation', () => {
  describe('createAccessToken', () => {
    it('cree token access valide', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = createAccessToken(payload);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token.split('.').length).toBe(3);
    });

    it('cree tokens differents pour payloads differents', () => {
      const payload1 = { id: 1, email: 'user1@example.com' };
      const payload2 = { id: 2, email: 'user2@example.com' };

      const token1 = createAccessToken(payload1);
      const token2 = createAccessToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('gere payload minimal id et email', () => {
      const minimalPayload = { id: 99, email: 'minimal@test.com' };
      const token = createAccessToken(minimalPayload);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('createRefreshToken', () => {
    it('cree token refresh valide', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = createRefreshToken(payload);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token.split('.').length).toBe(3);
    });

    it('cree tokens differents pour payloads differents', () => {
      const payload1 = { id: 1, email: 'user1@example.com' };
      const payload2 = { id: 2, email: 'user2@example.com' };

      const token1 = createRefreshToken(payload1);
      const token2 = createRefreshToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('access et refresh differents pour meme payload', () => {
      const payload = { id: 1, email: 'test@example.com' };

      const accessToken = createAccessToken(payload);
      const refreshToken = createRefreshToken(payload);

      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('Token format validation', () => {
    it('access token format jwt valide', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = createAccessToken(payload);
      const parts = token.split('.');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBeTruthy();
      expect(parts[1]).toBeTruthy();
      expect(parts[2]).toBeTruthy();
    });

    it('refresh token format jwt valide', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = createRefreshToken(payload);
      const parts = token.split('.');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBeTruthy();
      expect(parts[1]).toBeTruthy();
      expect(parts[2]).toBeTruthy();
    });
  });
});
