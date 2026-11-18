import request from 'supertest';
import webpush from 'web-push';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { env } from '../../config/env';
import { flushBackgroundTasks } from '../../utils/background.util';
import { notificationService } from '../../modules/notifications/notification.service';
import { clearUsers, disconnectPrisma } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

jest.mock('web-push', () => ({
  __esModule: true,
  default: { setVapidDetails: jest.fn(), sendNotification: jest.fn() },
}));

const mockSend = webpush.sendNotification as jest.MockedFunction<typeof webpush.sendNotification>;

describe('Browser push notifications Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;
  const subscriptionsUrl = api + ROUTES.notifications.pushSubscriptions;
  const originalKeys = { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY };

  const subscription = (id: string) => ({
    endpoint: `https://push.example.com/send/${id}`,
    keys: { p256dh: `p256dh-${id}`, auth: `auth-${id}` },
  });

  const clearAll = async () => {
    await prisma.conversation.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.pushSubscription.deleteMany();
    await clearUsers();
  };

  beforeAll(clearAll);

  beforeEach(() => {
    env.VAPID_PUBLIC_KEY = 'test-public-key';
    env.VAPID_PRIVATE_KEY = 'test-private-key';
    mockSend.mockReset();
    mockSend.mockResolvedValue({ statusCode: 201, body: '', headers: {} });
  });

  afterEach(clearAll);

  afterAll(async () => {
    env.VAPID_PUBLIC_KEY = originalKeys.publicKey;
    env.VAPID_PRIVATE_KEY = originalKeys.privateKey;
    await disconnectPrisma();
  });

  const createAndLoginUser = async (name: string) => {
    const credentials = { email: `${name}@test.com`, password: 'Password123!' };
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({ ...credentials, confirmPassword: credentials.password, username: name });
    const res = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send(credentials);
    return {
      id: res.body.data.user.id as number,
      auth: { Authorization: `Bearer ${res.body.data.accessToken}` },
    };
  };

  it('should expose the public key, or 503 when push is not configured', async () => {
    const res = await request(app).get(api + ROUTES.notifications.pushPublicKey);
    expect(res.status).toBe(200);
    expect(res.body.data.publicKey).toBe('test-public-key');

    env.VAPID_PUBLIC_KEY = '';
    const disabled = await request(app).get(api + ROUTES.notifications.pushPublicKey);
    expect(disabled.status).toBe(503);
  });

  it('should save, move and remove a browser subscription', async () => {
    const alice = await createAndLoginUser('pushalice');
    const bob = await createAndLoginUser('pushbob');

    expect((await request(app).post(subscriptionsUrl).send(subscription('a'))).status).toBe(401);
    expect(
      (await request(app).post(subscriptionsUrl).set(alice.auth).send({ endpoint: 'nope' })).status,
    ).toBe(400);

    const created = await request(app)
      .post(subscriptionsUrl)
      .set(alice.auth)
      .send(subscription('a'));
    expect(created.status).toBe(201);

    // Même navigateur, autre compte : l'abonnement passe au nouveau membre
    await request(app).post(subscriptionsUrl).set(bob.auth).send(subscription('a'));
    const stored = await prisma.pushSubscription.findMany();
    expect(stored).toHaveLength(1);
    expect(stored[0]!.userId).toBe(bob.id);

    // Un membre ne peut pas retirer l'abonnement d'un autre
    await request(app)
      .delete(subscriptionsUrl)
      .set(alice.auth)
      .send({ endpoint: subscription('a').endpoint });
    expect(await prisma.pushSubscription.count()).toBe(1);

    const removed = await request(app)
      .delete(subscriptionsUrl)
      .set(bob.auth)
      .send({ endpoint: subscription('a').endpoint });
    expect(removed.status).toBe(200);
    expect(await prisma.pushSubscription.count()).toBe(0);
  });

  it('should push every new notification to all devices of the recipient', async () => {
    const sender = await createAndLoginUser('pushsender');
    const recipient = await createAndLoginUser('pushrecipient');
    await request(app).post(subscriptionsUrl).set(recipient.auth).send(subscription('phone'));
    await request(app).post(subscriptionsUrl).set(recipient.auth).send(subscription('laptop'));

    await request(app)
      .post(`${api}/messages`)
      .set(sender.auth)
      .send({ recipientId: recipient.id, content: 'Salut, une question sur ton tip' });
    await flushBackgroundTasks();

    expect(mockSend).toHaveBeenCalledTimes(2);
    const [target, message] = mockSend.mock.calls[0]!;
    expect(target.endpoint).toMatch(/^https:\/\/push\.example\.com\/send\//);
    expect(JSON.parse(message as string)).toMatchObject({
      title: expect.any(String),
      link: expect.stringContaining('/messages'),
    });
  });

  it('should forget expired subscriptions and send nothing when push is disabled', async () => {
    const sender = await createAndLoginUser('pushsender2');
    const recipient = await createAndLoginUser('pushrecipient2');
    await request(app).post(subscriptionsUrl).set(recipient.auth).send(subscription('old'));

    mockSend.mockRejectedValueOnce(Object.assign(new Error('gone'), { statusCode: 410 }));
    await request(app)
      .post(`${api}/messages`)
      .set(sender.auth)
      .send({ recipientId: recipient.id, content: 'Premier message' });
    await flushBackgroundTasks();
    expect(await prisma.pushSubscription.count()).toBe(0);

    await request(app).post(subscriptionsUrl).set(recipient.auth).send(subscription('new'));
    env.VAPID_PRIVATE_KEY = '';
    mockSend.mockClear();
    await notificationService.notify(recipient.id, { type: 'NEW_TIP', title: 'Nouveau tip' });
    await flushBackgroundTasks();
    expect(mockSend).not.toHaveBeenCalled();
    // La notification reste visible dans l'application
    expect(await prisma.notification.count({ where: { userId: recipient.id } })).toBe(2);
  });
});
