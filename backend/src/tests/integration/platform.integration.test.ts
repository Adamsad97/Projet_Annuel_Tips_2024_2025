import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import { rolloutBucket } from '../../modules/features/feature.service';
import { tipService } from '../../modules/tips/tip.service';

describe('Feature flags and centralized logs Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;

  const clearAll = async () => {
    await prisma.featureFlag.deleteMany();
    await prisma.errorLog.deleteMany();
    await prisma.admin.deleteMany();
    await clearTips();
    await clearUsers();
  };

  beforeAll(clearAll);
  afterEach(async () => {
    jest.restoreAllMocks();
    await clearAll();
  });
  afterAll(async () => {
    await disconnectPrisma();
  });

  const createUser = async (name: string, admin = false) => {
    const email = `${name}@test.com`;
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({ email, password: 'Password123!', username: name });
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    if (admin) await prisma.admin.create({ data: { userId: user.id } });
    const login = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email, password: 'Password123!' });
    return { id: user.id, auth: { Authorization: `Bearer ${login.body.data.accessToken}` } };
  };

  const setFlag = (admin: { auth: Record<string, string> }, key: string, body: object) =>
    request(app).patch(`${api}/admin/features/${key}`).set(admin.auth).send(body);

  // L'écriture du log est asynchrone (elle ne retarde pas la réponse)
  const waitForLogs = async (expected: number) => {
    for (let i = 0; i < 20; i++) {
      if ((await prisma.errorLog.count()) >= expected) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  describe('Feature flags', () => {
    it('should enable known features for everyone by default', async () => {
      const user = await createUser('member');

      const guest = await request(app).get(`${api}/features`);
      const member = await request(app).get(`${api}/features`).set(user.auth);

      expect(guest.body.data).toEqual({ chatbot: true, trends_page: true, ads: true });
      expect(member.body.data).toEqual({ chatbot: true, trends_page: true, ads: true });
    });

    it('should turn a feature off for everyone, frontend and API', async () => {
      const admin = await createUser('boss', true);
      const user = await createUser('member');

      expect((await setFlag(admin, 'trends_page', { enabled: false })).status).toBe(200);
      expect((await setFlag(admin, 'chatbot', { enabled: false })).status).toBe(200);

      expect((await request(app).get(`${api}/tips/trending`)).status).toBe(404);
      const ask = await request(app)
        .post(`${api}/chatbot/ask`)
        .set(user.auth)
        .send({ question: 'Comment débuter avec Git ?' });
      expect(ask.status).toBe(404);

      const features = await request(app).get(`${api}/features`).set(user.auth);
      expect(features.body.data).toMatchObject({ chatbot: false, trends_page: false });
    });

    it('should expose a partial rollout to a stable group of members only', async () => {
      const admin = await createUser('boss', true);
      const members = await Promise.all(
        ['member1', 'member2', 'member3', 'member4', 'member5', 'member6'].map((name) =>
          createUser(name),
        ),
      );

      await setFlag(admin, 'chatbot', { rolloutPercentage: 50 });

      for (const member of members) {
        const expected = rolloutBucket('chatbot', member.id) < 50;
        const first = await request(app).get(`${api}/features`).set(member.auth);
        const second = await request(app).get(`${api}/features`).set(member.auth);
        expect(first.body.data.chatbot).toBe(expected);
        expect(second.body.data.chatbot).toBe(expected);
      }

      // Les visiteurs ne voient pas une fonctionnalité partiellement déployée
      expect((await request(app).get(`${api}/features`)).body.data.chatbot).toBe(false);

      const adminList = await request(app).get(`${api}/admin/features`).set(admin.auth);
      const chatbot = adminList.body.data.find((f: { key: string }) => f.key === 'chatbot');
      const allIds = [admin.id, ...members.map((m) => m.id)];
      expect(chatbot).toMatchObject({
        rolloutPercentage: 50,
        totalUsers: allIds.length,
        exposedUsers: allIds.filter((id) => rolloutBucket('chatbot', id) < 50).length,
      });
    });

    it('should reject unknown features and non-admins', async () => {
      const admin = await createUser('boss', true);
      const user = await createUser('member');

      expect((await setFlag(admin, 'teleportation', { enabled: true })).status).toBe(404);
      expect((await setFlag(admin, 'chatbot', { rolloutPercentage: 150 })).status).toBe(400);
      expect((await setFlag(user, 'chatbot', { enabled: false })).status).toBe(403);
    });
  });

  describe('Centralized logs', () => {
    it('should record unexpected server errors with request details', async () => {
      const admin = await createUser('boss', true);
      jest.spyOn(tipService, 'getAllTips').mockRejectedValueOnce(new Error('database exploded'));

      const res = await request(app).get(`${api}/tips?q=git`).set(admin.auth);
      expect(res.status).toBe(500);
      await waitForLogs(1);

      const logs = await request(app).get(`${api}/admin/logs?source=server`).set(admin.auth);
      expect(logs.status).toBe(200);
      expect(logs.body.data.total).toBe(1);
      expect(logs.body.data.items[0]).toMatchObject({
        source: 'server',
        message: 'database exploded',
        method: 'GET',
        path: '/api/tips?q=git',
        statusCode: 500,
        userId: admin.id,
      });
      expect(logs.body.data.items[0].stack).toContain('database exploded');
    });

    it('should not record client errors such as 404 or validation errors', async () => {
      await request(app).get(`${api}/tips/999999`);
      await request(app).get(`${api}/tips?take=abc`);

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(await prisma.errorLog.count()).toBe(0);
    });

    it('should collect frontend errors and let the admin filter and purge logs', async () => {
      const admin = await createUser('boss', true);
      const user = await createUser('member');

      const report = await request(app)
        .post(`${api}/logs/client`)
        .set(user.auth)
        .set('User-Agent', 'jest-browser')
        .send({ message: 'Cannot read properties of undefined', path: '/tips/3' });
      expect(report.status).toBe(201);

      expect((await request(app).post(`${api}/logs/client`).send({})).status).toBe(400);

      const clientLogs = await request(app).get(`${api}/admin/logs?source=client`).set(admin.auth);
      expect(clientLogs.body.data.items[0]).toMatchObject({
        source: 'client',
        path: '/tips/3',
        userId: user.id,
        context: { userAgent: 'jest-browser' },
      });

      const search = await request(app).get(`${api}/admin/logs?q=undefined`).set(admin.auth);
      expect(search.body.data.total).toBe(1);

      const purge = await request(app).delete(`${api}/admin/logs?olderThanDays=0`).set(admin.auth);
      expect(purge.body.data.deleted).toBe(1);

      expect((await request(app).get(`${api}/admin/logs`).set(user.auth)).status).toBe(403);
    });
  });
});
