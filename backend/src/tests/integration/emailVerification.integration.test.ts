import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, disconnectPrisma } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import { sentMailsForTests } from '../../modules/mail/mail.service';

describe('Email verification Integration', () => {
  const baseUsers = ROUTES.api + ROUTES.users.base;
  const baseAuth = ROUTES.api + ROUTES.auth.base;
  const PASSWORD = 'Password123!';

  const clearAll = async () => {
    await prisma.emailVerificationToken.deleteMany();
    await clearUsers();
    sentMailsForTests.length = 0;
  };

  beforeAll(async () => {
    process.env.EMAIL_VERIFICATION = 'true';
    await clearAll();
  });
  afterEach(clearAll);
  afterAll(async () => {
    process.env.EMAIL_VERIFICATION = 'false';
    await disconnectPrisma();
  });

  const register = (name: string) =>
    request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({
        email: `${name}@test.com`,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        username: name,
      });
  const login = (name: string) =>
    request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email: `${name}@test.com`, password: PASSWORD });
  const verify = (token: string) =>
    request(app)
      .post(baseAuth + ROUTES.auth.verifyEmail)
      .send({ token });
  const resend = (email: string) =>
    request(app)
      .post(baseAuth + ROUTES.auth.resendVerification)
      .send({ email });

  const tokenFromLastMail = () => {
    const mail = sentMailsForTests.at(-1)!;
    return mail.text.match(/verify-email\?token=([a-f0-9]{64})/)![1]!;
  };

  it('should send a link on signup and refuse login until the email is verified', async () => {
    const res = await register('newcomer');
    expect(res.status).toBe(201);
    expect(res.body.data.emailVerificationRequired).toBe(true);

    expect(sentMailsForTests).toHaveLength(1);
    expect(sentMailsForTests[0]!.to).toBe('newcomer@test.com');
    expect(sentMailsForTests[0]!.html).toContain('/auth/verify-email?token=');

    const refused = await login('newcomer');
    expect(refused.status).toBe(403);
    expect(refused.body.message).toBe('email not verified');

    // Mauvais mot de passe : on ne révèle pas que l'adresse n'est pas vérifiée
    const wrongPassword = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email: 'newcomer@test.com', password: 'Wrong123!' });
    expect(wrongPassword.status).toBe(401);

    const token = tokenFromLastMail();
    expect((await verify(token)).status).toBe(200);

    const accepted = await login('newcomer');
    expect(accepted.status).toBe(200);
    expect(accepted.body.data).toHaveProperty('accessToken');

    // Le lien ne sert qu'une fois ; le jeton n'est jamais stocké en clair
    expect((await verify(token)).status).toBe(400);
    const stored = await prisma.emailVerificationToken.count();
    expect(stored).toBe(0);
  });

  it('should reject invalid and expired links', async () => {
    await register('late');
    const token = tokenFromLastMail();

    expect((await verify('not-a-token')).status).toBe(400);
    expect((await verify('a'.repeat(64))).status).toBe(400);

    await prisma.emailVerificationToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const expired = await verify(token);
    expect(expired.status).toBe(400);
    expect(expired.body.message).toBe('invalid or expired verification link');
    expect((await login('late')).status).toBe(403);
  });

  it('should resend a new link without revealing which emails exist', async () => {
    await register('forgetful');
    const firstToken = tokenFromLastMail();

    // Trop tôt : pas de nouvel email (anti-spam), mais même réponse
    const tooSoon = await resend('forgetful@test.com');
    expect(tooSoon.status).toBe(200);
    expect(sentMailsForTests).toHaveLength(1);

    await prisma.emailVerificationToken.updateMany({
      data: { createdAt: new Date(Date.now() - 2 * 60 * 1000) },
    });
    const resent = await resend('Forgetful@Test.com');
    expect(resent.status).toBe(200);
    expect(sentMailsForTests).toHaveLength(2);

    // L'ancien lien est remplacé par le nouveau
    expect((await verify(firstToken)).status).toBe(400);
    expect((await verify(tokenFromLastMail())).status).toBe(200);

    // Compte inconnu ou déjà vérifié : même réponse, aucun email
    expect((await resend('nobody@test.com')).body.message).toBe(resent.body.message);
    expect((await resend('forgetful@test.com')).status).toBe(200);
    expect(sentMailsForTests).toHaveLength(2);
  });
});
