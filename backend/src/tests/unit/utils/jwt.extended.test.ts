import { createAccessToken, createRefreshToken } from '../../../utils/jwt.util';

// Tests simples pour vérifier que les tokens sont bien créés
describe('JWT Utils - Token Creation', () => {
  describe('createAccessToken', () => {
    it('should create a valid access token string', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = createAccessToken(payload);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
    });

    it('should create different tokens for different payloads', () => {
      const payload1 = { id: 1, email: 'user1@example.com' };
      const payload2 = { id: 2, email: 'user2@example.com' };

      const token1 = createAccessToken(payload1);
      const token2 = createAccessToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('should handle payload with only id and email', () => {
      const minimalPayload = { id: 99, email: 'minimal@test.com' };
      const token = createAccessToken(minimalPayload);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('createRefreshToken', () => {
    it('should create a valid refresh token string', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = createRefreshToken(payload);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token.split('.').length).toBe(3); // JWT format
    });

    it('should create different tokens for different payloads', () => {
      const payload1 = { id: 1, email: 'user1@example.com' };
      const payload2 = { id: 2, email: 'user2@example.com' };

      const token1 = createRefreshToken(payload1);
      const token2 = createRefreshToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('should create different access and refresh tokens for same payload', () => {
      const payload = { id: 1, email: 'test@example.com' };

      const accessToken = createAccessToken(payload);
      const refreshToken = createRefreshToken(payload);

      // They should be different because they have different expiration times
      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('Token format validation', () => {
    it('access token should be a valid JWT format', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = createAccessToken(payload);
      const parts = token.split('.');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBeTruthy(); // header
      expect(parts[1]).toBeTruthy(); // payload
      expect(parts[2]).toBeTruthy(); // signature
    });

    it('refresh token should be a valid JWT format', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = createRefreshToken(payload);
      const parts = token.split('.');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBeTruthy(); // header
      expect(parts[1]).toBeTruthy(); // payload
      expect(parts[2]).toBeTruthy(); // signature
    });
  });
});
