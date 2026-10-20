import request from 'supertest';
import { authenticator } from 'otplib';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, disconnectPrisma } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

describe('Two-factor authentication Integration', () => {
  const baseUsers = ROUTES.api + ROUTES.users.base;
  const twoFactor = {
    setup: baseUsers + ROUTES.twoFactor.setup,
    enable: baseUsers + ROUTES.twoFactor.enable,
    disable: baseUsers + ROUTES.twoFactor.disable,
    login: baseUsers + ROUTES.twoFactor.login,
  };
  const EMAIL = 'secure@test.com';
  const PASSWORD = 'Password123!';

  beforeEach(async () => {
    await clearUsers();
  });

  afterAll(async () => {
    await clearUsers();
    await disconnectPrisma();
  });

  const registerAndLogin = async () => {
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({
        email: EMAIL,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        username: 'secure',
      });
    const res = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email: EMAIL, password: PASSWORD });
    return res.body.data.accessToken as string;
  };

  // Configure et active la 2FA, renvoie le secret et les codes de secours
  const enableTwoFactor = async (token: string) => {
    const setup = await request(app).post(twoFactor.setup).set('Authorization', `Bearer ${token}`);
    const secret = setup.body.data.secret as string;

    const enable = await request(app)
      .post(twoFactor.enable)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: authenticator.generate(secret) });

    return { setup, enable, secret, backupCodes: enable.body.data.backupCodes as string[] };
  };

  it('should set up and enable 2FA with a valid code', async () => {
    const token = await registerAndLogin();

    const wrongBeforeSetup = await request(app)
      .post(twoFactor.enable)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' });
    expect(wrongBeforeSetup.status).toBe(400);

    const { setup, enable, backupCodes } = await enableTwoFactor(token);

    expect(setup.status).toBe(200);
    expect(setup.body.data.otpauthUrl).toContain('otpauth://totp/AideFlash');
    expect(setup.body.data.qrCode).toMatch(/^data:image\/png;base64,/);

    expect(enable.status).toBe(200);
    expect(backupCodes).toHaveLength(8);
    expect(backupCodes[0]).toMatch(/^[0-9a-f]{4}-[0-9a-f]{4}$/);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(user.isTwoFactorEnabled).toBe(true);
    // Les codes de secours ne sont jamais stockés en clair
    expect(user.twoFactorBackupCodes).not.toContain(backupCodes[0]);

    const profile = await request(app)
      .get(baseUsers + ROUTES.users.profile)
      .set('Authorization', `Bearer ${token}`);
    expect(profile.body.data.isTwoFactorEnabled).toBe(true);
    expect(profile.body.data).not.toHaveProperty('twoFactorSecret');
    expect(profile.body.data).not.toHaveProperty('twoFactorBackupCodes');
  });

  it('should refuse enabling 2FA with a wrong code', async () => {
    const token = await registerAndLogin();
    await request(app).post(twoFactor.setup).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(twoFactor.enable)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });

    expect(res.status).toBe(400);
  });

  it('should require the 2FA code at login', async () => {
    const token = await registerAndLogin();
    const { secret } = await enableTwoFactor(token);

    const login = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email: EMAIL, password: PASSWORD });

    expect(login.status).toBe(200);
    expect(login.body.data.twoFactorRequired).toBe(true);
    expect(login.body.data).not.toHaveProperty('accessToken');
    const twoFactorToken = login.body.data.twoFactorToken as string;

    // Le jeton temporaire ne donne pas accès à l'API
    const withTempToken = await request(app)
      .get(baseUsers + ROUTES.users.profile)
      .set('Authorization', `Bearer ${twoFactorToken}`);
    expect(withTempToken.status).toBe(401);

    const wrongCode = await request(app)
      .post(twoFactor.login)
      .send({ twoFactorToken, code: '000000' });
    expect(wrongCode.status).toBe(401);

    const ok = await request(app)
      .post(twoFactor.login)
      .send({ twoFactorToken, code: authenticator.generate(secret) });
    expect(ok.status).toBe(200);
    expect(ok.body.data.accessToken).toBeDefined();
    expect(ok.body.data.user.email).toBe(EMAIL);
    expect(ok.body.data.user).not.toHaveProperty('twoFactorSecret');
  });

  it('should accept each backup code only once', async () => {
    const token = await registerAndLogin();
    const { backupCodes } = await enableTwoFactor(token);

    const loginWithBackupCode = async () => {
      const login = await request(app)
        .post(baseUsers + ROUTES.users.login)
        .send({ email: EMAIL, password: PASSWORD });
      return request(app)
        .post(twoFactor.login)
        .send({ twoFactorToken: login.body.data.twoFactorToken, code: backupCodes[0] });
    };

    expect((await loginWithBackupCode()).status).toBe(200);
    expect((await loginWithBackupCode()).status).toBe(401);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(user.twoFactorBackupCodes).toHaveLength(7);
  });

  it('should disable 2FA with password and code', async () => {
    const token = await registerAndLogin();
    const { secret } = await enableTwoFactor(token);

    const wrongPassword = await request(app)
      .post(twoFactor.disable)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'Wrong123!', code: authenticator.generate(secret) });
    expect(wrongPassword.status).toBe(400);

    const ok = await request(app)
      .post(twoFactor.disable)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: PASSWORD, code: authenticator.generate(secret) });
    expect(ok.status).toBe(200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(user.isTwoFactorEnabled).toBe(false);
    expect(user.twoFactorSecret).toBeNull();

    const login = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email: EMAIL, password: PASSWORD });
    expect(login.body.data.accessToken).toBeDefined();
  });
});
