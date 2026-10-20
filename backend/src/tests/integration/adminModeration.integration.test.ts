import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

describe('Advanced moderation, appeals and admin Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;
  const PASSWORD = 'Password123!';

  const clearAll = async () => {
    await prisma.appeal.deleteMany();
    await prisma.moderationAction.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.moderator.deleteMany();
    await prisma.admin.deleteMany();
    await clearTips();
    await clearUsers();
  };

  beforeAll(async () => {
    await seedBadges();
    for (const grade of [
      { name: 'Débutant', xpRequired: 0 },
      { name: 'Novice', xpRequired: 50 },
      { name: 'Intermédiaire', xpRequired: 100 },
    ]) {
      await prisma.grade.upsert({ where: { name: grade.name }, update: grade, create: grade });
    }
    await clearAll();
  });

  afterEach(clearAll);

  afterAll(async () => {
    await disconnectPrisma();
  });

  const createUser = async (name: string, role: 'USER' | 'MODERATOR' | 'ADMIN' = 'USER') => {
    const email = `${name}@test.com`;
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({ email, password: PASSWORD, username: name });
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    if (role === 'MODERATOR') await prisma.moderator.create({ data: { userId: user.id } });
    if (role === 'ADMIN') await prisma.admin.create({ data: { userId: user.id } });

    const login = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email, password: PASSWORD });
    const token = login.body.data.accessToken as string;

    return {
      id: user.id,
      email,
      token,
      auth: { Authorization: `Bearer ${token}` },
    };
  };

  const getUser = (id: number) => prisma.user.findUniqueOrThrow({ where: { id } });

  describe('Moderator actions', () => {
    it('should warn a user, notify them and reward the moderator', async () => {
      const moderator = await createUser('modo', 'MODERATOR');
      const user = await createUser('member');
      const xpBefore = (await getUser(moderator.id)).xp;

      const res = await request(app)
        .post(`${api}/moderation/users/${user.id}/warn`)
        .set(moderator.auth)
        .send({ reason: 'Propos insultants dans les commentaires' });

      expect(res.status).toBe(201);
      expect(res.body.data.actionType).toBe('WARN');
      expect((await getUser(moderator.id)).xp).toBe(xpBefore + 3);

      const notification = await prisma.notification.findFirst({
        where: { userId: user.id, type: 'MODERATION' },
      });
      expect(notification?.title).toBe('Vous avez reçu un avertissement');
    });

    it('should not let a moderator sanction themselves, moderators or admins', async () => {
      const moderator = await createUser('modo', 'MODERATOR');
      const otherModerator = await createUser('modo2', 'MODERATOR');
      const admin = await createUser('boss', 'ADMIN');
      const warn = (id: number) =>
        request(app)
          .post(`${api}/moderation/users/${id}/warn`)
          .set(moderator.auth)
          .send({ reason: 'Raison suffisante' });

      expect((await warn(moderator.id)).status).toBe(400);
      expect((await warn(otherModerator.id)).status).toBe(403);
      expect((await warn(admin.id)).status).toBe(403);
    });

    it('should downgrade a user by one grade', async () => {
      const moderator = await createUser('modo', 'MODERATOR');
      const user = await createUser('member');
      await prisma.user.update({ where: { id: user.id }, data: { xp: 120 } });
      const current = await prisma.grade.findFirstOrThrow({
        where: { xpRequired: { lte: 120 } },
        orderBy: { xpRequired: 'desc' },
      });
      await prisma.user.update({ where: { id: user.id }, data: { gradeId: current.id } });
      const previous = await prisma.grade.findFirstOrThrow({
        where: { xpRequired: { lt: current.xpRequired } },
        orderBy: { xpRequired: 'desc' },
      });

      const res = await request(app)
        .post(`${api}/moderation/users/${user.id}/downgrade`)
        .set(moderator.auth)
        .send({ reason: 'Contenus de mauvaise qualité répétés' });

      expect(res.status).toBe(201);
      const updated = await getUser(user.id);
      expect(updated.xp).toBe(previous.xpRequired);
      expect(updated.gradeId).toBe(previous.id);
      expect(res.body.data.metadata).toMatchObject({ previousXp: 120 });
    });

    it('should let an admin who is not a moderator use moderation routes', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const res = await request(app).get(`${api}/moderation/stats`).set(admin.auth);
      expect(res.status).toBe(200);
    });
  });

  describe('Appeals', () => {
    it('should contest a downgrade and restore XP when the admin accepts', async () => {
      const moderator = await createUser('modo', 'MODERATOR');
      const admin = await createUser('boss', 'ADMIN');
      const user = await createUser('member');
      await prisma.user.update({ where: { id: user.id }, data: { xp: 120 } });
      await request(app)
        .post(`${api}/moderation/users/${user.id}/downgrade`)
        .set(moderator.auth)
        .send({ reason: 'Contenus de mauvaise qualité' });

      const mine = await request(app).get(`${api}/moderation-actions/mine`).set(user.auth);
      expect(mine.status).toBe(200);
      expect(mine.body.data).toHaveLength(1);
      expect(mine.body.data[0]).toMatchObject({ actionType: 'DOWNGRADE', canAppeal: true });
      const actionId = mine.body.data[0].id;

      const appeal = await request(app)
        .post(`${api}/moderation-actions/${actionId}/appeal`)
        .set(user.auth)
        .send({ reason: 'Mes contenus respectaient les règles' });
      expect(appeal.status).toBe(201);

      const duplicate = await request(app)
        .post(`${api}/moderation-actions/${actionId}/appeal`)
        .set(user.auth)
        .send({ reason: 'Je conteste encore une fois' });
      expect(duplicate.status).toBe(409);

      const openAppeals = await request(app).get(`${api}/admin/appeals`).set(admin.auth);
      expect(openAppeals.body.data).toHaveLength(1);

      const resolved = await request(app)
        .post(`${api}/admin/appeals/${appeal.body.data.id}/resolve`)
        .set(admin.auth)
        .send({ decision: 'ACCEPTED', response: 'Rétrogradation injustifiée' });
      expect(resolved.status).toBe(200);
      expect(resolved.body.data.status).toBe('ACCEPTED');

      expect((await getUser(user.id)).xp).toBe(120);
      const action = await prisma.moderationAction.findUniqueOrThrow({ where: { id: actionId } });
      expect(action.overturnedAt).not.toBeNull();

      const again = await request(app)
        .post(`${api}/admin/appeals/${appeal.body.data.id}/resolve`)
        .set(admin.auth)
        .send({ decision: 'REJECTED' });
      expect(again.status).toBe(400);
    });

    it('should not let a user contest an action targeting someone else', async () => {
      const moderator = await createUser('modo', 'MODERATOR');
      const victim = await createUser('member');
      const other = await createUser('other');
      const warn = await request(app)
        .post(`${api}/moderation/users/${victim.id}/warn`)
        .set(moderator.auth)
        .send({ reason: 'Avertissement de test' });

      const res = await request(app)
        .post(`${api}/moderation-actions/${warn.body.data.id}/appeal`)
        .set(other.auth)
        .send({ reason: 'Je conteste pour un autre' });
      expect(res.status).toBe(404);
    });
  });

  describe('Admin: sanctions', () => {
    it('should ban a user: login, token refresh and publishing are refused', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const user = await createUser('troll');
      const login = await request(app)
        .post(baseUsers + ROUTES.users.login)
        .send({ email: user.email, password: PASSWORD });

      const ban = await request(app)
        .post(`${api}/admin/users/${user.id}/ban`)
        .set(admin.auth)
        .send({ reason: 'Spam répété', days: 7 });
      expect(ban.status).toBe(201);

      const loginAfter = await request(app)
        .post(baseUsers + ROUTES.users.login)
        .send({ email: user.email, password: PASSWORD });
      expect(loginAfter.status).toBe(403);
      expect(loginAfter.body.message).toContain('Spam répété');

      const refresh = await request(app)
        .post(api + ROUTES.auth.base + ROUTES.auth.refresh)
        .send({ refreshToken: login.body.data.refreshToken });
      expect(refresh.status).toBe(403);

      const tip = await request(app)
        .post(api + ROUTES.tips.base)
        .set(user.auth)
        .send({ title: 'Tip interdit', content: 'Contenu pendant le ban' });
      expect(tip.status).toBe(403);

      await request(app).delete(`${api}/admin/users/${user.id}/ban`).set(admin.auth);
      const loginUnbanned = await request(app)
        .post(baseUsers + ROUTES.users.login)
        .send({ email: user.email, password: PASSWORD });
      expect(loginUnbanned.status).toBe(200);
    });

    it('should mute a user who can still log in but not publish', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const user = await createUser('loud');

      const noDuration = await request(app)
        .post(`${api}/admin/users/${user.id}/mute`)
        .set(admin.auth)
        .send({ reason: 'Trop de messages' });
      expect(noDuration.status).toBe(400);

      await request(app)
        .post(`${api}/admin/users/${user.id}/mute`)
        .set(admin.auth)
        .send({ reason: 'Trop de messages', days: 3 });

      const login = await request(app)
        .post(baseUsers + ROUTES.users.login)
        .send({ email: user.email, password: PASSWORD });
      expect(login.status).toBe(200);

      const tip = await request(app)
        .post(api + ROUTES.tips.base)
        .set(user.auth)
        .send({ title: 'Tip muet', content: 'Contenu pendant le mute' });
      expect(tip.status).toBe(403);

      await request(app).delete(`${api}/admin/users/${user.id}/mute`).set(admin.auth);
      const tipAfter = await request(app)
        .post(api + ROUTES.tips.base)
        .set(user.auth)
        .send({ title: 'Tip autorisé', content: 'Contenu après le mute' });
      expect(tipAfter.status).toBe(201);
    });

    it('should refuse sanctions on self or another admin, and non-admin access', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const otherAdmin = await createUser('boss2', 'ADMIN');
      const moderator = await createUser('modo', 'MODERATOR');
      const ban = (id: number) =>
        request(app)
          .post(`${api}/admin/users/${id}/ban`)
          .set(admin.auth)
          .send({ reason: 'Raison de test' });

      expect((await ban(admin.id)).status).toBe(400);
      expect((await ban(otherAdmin.id)).status).toBe(403);
      expect((await request(app).get(`${api}/admin/users`).set(moderator.auth)).status).toBe(403);
    });
  });

  describe('Admin: accounts', () => {
    it('should list users with roles and status, adjust the trust index, reset and delete', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const user = await createUser('member');
      await prisma.user.update({ where: { id: user.id }, data: { xp: 300 } });

      const list = await request(app).get(`${api}/admin/users?q=member`).set(admin.auth);
      expect(list.status).toBe(200);
      expect(list.body.data.total).toBe(1);
      expect(list.body.data.items[0]).toMatchObject({
        id: user.id,
        role: 'USER',
        isBanned: false,
        trustIndex: 50,
      });

      const trust = await request(app)
        .patch(`${api}/admin/users/${user.id}/trust-index`)
        .set(admin.auth)
        .send({ trustIndex: 75, reason: 'Correction après un bug' });
      expect(trust.status).toBe(200);
      expect((await getUser(user.id)).trustIndex).toBe(75);

      const reset = await request(app).post(`${api}/admin/users/${user.id}/reset`).set(admin.auth);
      expect(reset.status).toBe(200);
      // Le reset efface l'ajustement manuel : l'indice revient à sa valeur calculée
      const afterReset = await getUser(user.id);
      expect(afterReset).toMatchObject({ xp: 0, trustAdjustment: 0 });
      expect(afterReset.trustIndex).not.toBe(75);

      const deleted = await request(app).delete(`${api}/admin/users/${user.id}`).set(admin.auth);
      expect(deleted.status).toBe(200);
      expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
    });
  });

  describe('Admin: grades, badges and analytics', () => {
    it('should create, update and delete a grade and reassign users', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const user = await createUser('member');
      await prisma.user.update({ where: { id: user.id }, data: { xp: 9000 } });

      const created = await request(app)
        .post(`${api}/admin/grades`)
        .set(admin.auth)
        .send({ name: 'Grade de test', xpRequired: 8000 });
      expect(created.status).toBe(201);
      expect((await getUser(user.id)).gradeId).toBe(created.body.data.id);

      const updated = await request(app)
        .patch(`${api}/admin/grades/${created.body.data.id}`)
        .set(admin.auth)
        .send({ xpRequired: 9500 });
      expect(updated.status).toBe(200);
      expect((await getUser(user.id)).gradeId).not.toBe(created.body.data.id);

      const deleted = await request(app)
        .delete(`${api}/admin/grades/${created.body.data.id}`)
        .set(admin.auth);
      expect(deleted.status).toBe(200);
    });

    it('should use the badge XP reward configured by the admin', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const badge = await prisma.badge.findUniqueOrThrow({ where: { code: 'FIRST_TIP' } });
      const originalReward = badge.xpReward;

      const res = await request(app)
        .patch(`${api}/admin/badges/${badge.id}`)
        .set(admin.auth)
        .send({ xpReward: 42 });
      expect(res.status).toBe(200);

      const user = await createUser('author');
      await request(app)
        .post(api + ROUTES.tips.base)
        .set(user.auth)
        .send({ title: 'Premier tip', content: 'Contenu du premier tip' });

      // 10 XP pour la création du tip + 42 XP pour le badge FIRST_TIP
      expect((await getUser(user.id)).xp).toBe(52);

      await prisma.badge.update({ where: { id: badge.id }, data: { xpReward: originalReward } });
    });

    it('should return analytics', async () => {
      const admin = await createUser('boss', 'ADMIN');

      const res = await request(app).get(`${api}/admin/analytics`).set(admin.auth);

      expect(res.status).toBe(200);
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data.users.activeLast30Days).toBeGreaterThanOrEqual(1);
      expect(res.body.data.tips.perDay).toHaveLength(30);
      expect(res.body.data.moderation).toHaveProperty('openAppeals');
    });
  });
});
