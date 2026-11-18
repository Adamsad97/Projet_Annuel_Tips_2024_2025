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

  const registerAndLogin = async (username: string) => {
    const credentials = { email: `${username}@example.com`, password: 'Password123!' };
    await request(app)
      .post(base + ROUTES.users.register)
      .send({ ...credentials, confirmPassword: credentials.password, username });
    const res = await request(app)
      .post(base + ROUTES.users.login)
      .send(credentials);
    return res.body.data as { accessToken: string; refreshToken: string };
  };

  const refresh = (refreshToken: string) =>
    request(app)
      .post(ROUTES.api + ROUTES.auth.base + ROUTES.auth.refresh)
      .send({ refreshToken });

  it('should revoke refresh tokens on logout', async () => {
    const session = await registerAndLogin('logoutuser');
    const other = await registerAndLogin('logoutuser');

    // Le refresh fonctionne et renvoie des tokens utilisables
    const refreshed = await refresh(session.refreshToken);
    expect(refreshed.status).toBe(200);

    const logout = await request(app)
      .post(ROUTES.api + ROUTES.auth.base + ROUTES.auth.logout)
      .set('Authorization', `Bearer ${session.accessToken}`);
    expect(logout.status).toBe(200);

    // Tous les refresh tokens émis avant la déconnexion sont refusés, sur tous les appareils
    for (const token of [
      session.refreshToken,
      refreshed.body.data.refreshToken,
      other.refreshToken,
    ]) {
      const res = await refresh(token);
      expect(res.status).toBe(401);
    }

    // Une nouvelle connexion ouvre une session valide
    const again = await registerAndLogin('logoutuser');
    expect((await refresh(again.refreshToken)).status).toBe(200);
  });

  it('should revoke other sessions on password change and keep the current one', async () => {
    const current = await registerAndLogin('pwduser');
    const other = await registerAndLogin('pwduser');

    const res = await request(app)
      .patch(base + ROUTES.users.password)
      .set('Authorization', `Bearer ${current.accessToken}`)
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');

    expect((await refresh(other.refreshToken)).status).toBe(401);
    expect((await refresh(current.refreshToken)).status).toBe(401);
    expect((await refresh(res.body.data.refreshToken)).status).toBe(200);
  });
});
