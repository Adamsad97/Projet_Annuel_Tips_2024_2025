import request from 'supertest';
import app from '../../app';
import { ROUTES } from '../../config/routes';

describe('Integration - ping route', () => {
  const base = ROUTES.api;
  it(`should respond 200 on ${base}${ROUTES.ping}`, async () => {
    const res = await request(app).get(`${base}${ROUTES.ping}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
