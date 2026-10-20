import type { Request } from 'express';
import { getClientIp } from '../../../middlewares/rateLimiter.middleware';

const request = (headers: Record<string, string>, ip = '10.0.0.5') =>
  ({ headers, ip, socket: { remoteAddress: ip } }) as unknown as Request;

describe('getClientIp', () => {
  it("prend l'IP ajoutée par nginx, pas celle envoyée par le client", () => {
    // Un client qui falsifie X-Forwarded-For ne change pas sa clé de limitation
    expect(getClientIp(request({ 'x-forwarded-for': '1.2.3.4, 203.0.113.7' }))).toBe('203.0.113.7');
    expect(getClientIp(request({ 'x-forwarded-for': '203.0.113.7' }))).toBe('203.0.113.7');
  });

  it("utilise l'IP de la connexion sans proxy", () => {
    expect(getClientIp(request({}))).toBe('10.0.0.5');
  });
});
