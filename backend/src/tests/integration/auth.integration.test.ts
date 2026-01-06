import request from 'supertest';
import app from '../../app';
import { clearUsers, disconnectPrisma } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

describe('Auth integration', () => {
  const base = ROUTES.api + ROUTES.users.base;

  beforeAll(async () => {
    await clearUsers();
  });

  afterEach(async () => {
    await clearUsers();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('should register a user and return 201', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      username: 'tester',
    };
    const res = await request(app)
      .post(base + ROUTES.users.register)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(payload.email);
  });

  it('should login a user and return token', async () => {
    const payload = {
      email: 'login@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      username: 'loginuser',
    };
    // create first
    await request(app)
      .post(base + ROUTES.users.register)
      .send(payload);

    const res = await request(app)
      .post(base + ROUTES.users.login)
      .send({ email: payload.email, password: payload.password });
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(payload.email);
  });
});
