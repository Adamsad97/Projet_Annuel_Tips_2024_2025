import request from 'supertest';
import app from '../../app';
import {
  clearUsers,
  clearTips,
  clearModerationData,
  disconnectPrisma,
  seedBadges,
} from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import { prisma } from '../../db/prisma';

describe('Moderation Integration', () => {
  const baseAuth = ROUTES.api + ROUTES.users.base;
  const baseTips = ROUTES.api + ROUTES.tips.base;
  const baseMod = ROUTES.api + ROUTES.moderation.base;

  beforeAll(async () => {
    await seedBadges();
  });

  beforeEach(async () => {
    await clearModerationData();
    await clearTips();
    await clearUsers();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  // cree user en db direct pour eviter rate limit
  const createAndLoginUser = async (name = 'testuser') => {
    const user = await prisma.user.create({
      data: {
        email: `${name}@test.com`,
        password: 'hashed:Password123!',
        username: name,
        firstname: 'Test',
        lastname: 'User',
      },
    });

    const loginRes = await request(app)
      .post(baseAuth + ROUTES.users.login)
      .send({ email: user.email, password: 'Password123!' });

    return {
      token: loginRes.body.data?.accessToken || '',
      userId: user.id,
    };
  };

  const createModerator = async (name = 'moderator') => {
    const userData = await createAndLoginUser(name);

    await prisma.moderator.create({
      data: {
        userId: userData.userId,
        isActive: true,
      },
    });

    return userData;
  };

  const createAdmin = async (name = 'admin') => {
    const userData = await createAndLoginUser(name);

    await prisma.admin.create({
      data: {
        userId: userData.userId,
      },
    });

    await prisma.moderator.create({
      data: {
        userId: userData.userId,
        isActive: true,
      },
    });

    return userData;
  };

  const createPendingTip = async (userId: number) => {
    const tip = await prisma.tip.create({
      data: {
        title: 'Pending Tip',
        content: 'This tip needs approval',
        userId,
        status: 'PENDING',
      },
    });

    return tip.id;
  };

  const createReport = async (tipId: number, reporterUserId: number) => {
    return prisma.report.create({
      data: {
        tipId,
        userId: reporterUserId,
        reason: 'Inappropriate content',
        status: 'OPEN',
      },
    });
  };

  describe('POST /moderation/tips/:id/approve', () => {
    it('approuve un tip et donne de xp', async () => {
      const { token: userToken, userId } = await createAndLoginUser('tipauthor');
      const { token: modToken } = await createModerator('mod1');

      const tipId = await createPendingTip(userId);

      const userBefore = await prisma.user.findUnique({ where: { id: userId } });
      const xpBefore = userBefore?.xp || 0;

      const res = await request(app)
        .post(`${baseMod}/tips/${tipId}/approve`)
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');

      const userAfter = await prisma.user.findUnique({ where: { id: userId } });
      expect(userAfter?.xp).toBeGreaterThan(xpBefore);

      const action = await prisma.moderationAction.findFirst({
        where: { actionType: 'APPROVE_TIP' },
      });
      expect(action).toBeDefined();
      expect(action?.userId).toBe(userId);
    });

    it('bloque si pas moderateur', async () => {
      const { token: userToken, userId } = await createAndLoginUser('regularuser');
      const tipId = await createPendingTip(userId);

      const res = await request(app)
        .post(`${baseMod}/tips/${tipId}/approve`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /moderation/tips/:id/reject', () => {
    it('rejette un tip avec raison', async () => {
      const { userId } = await createAndLoginUser('tipauthor2');
      const { token: modToken } = await createModerator('mod2');

      const tipId = await createPendingTip(userId);

      const res = await request(app)
        .post(`${baseMod}/tips/${tipId}/reject`)
        .set('Authorization', `Bearer ${modToken}`)
        .send({ reason: 'Inappropriate content' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const tip = await prisma.tip.findUnique({ where: { id: tipId } });
      expect(tip?.status).toBe('REJECTED');

      const action = await prisma.moderationAction.findFirst({
        where: { actionType: 'REJECT_TIP' },
      });
      expect(action).toBeDefined();
      expect(action?.reason).toBe('Inappropriate content');
    });

    it('erreur si tip existe pas', async () => {
      const { token: modToken } = await createModerator('mod3');

      const res = await request(app)
        .post(`${baseMod}/tips/99999/reject`)
        .set('Authorization', `Bearer ${modToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /moderation/tips/pending', () => {
    it('retourne liste tips en attente avec pagination', async () => {
      const { token: modToken } = await createModerator('mod4');
      const { userId } = await createAndLoginUser('author1');

      await createPendingTip(userId);
      await createPendingTip(userId);
      await createPendingTip(userId);

      const res = await request(app)
        .get(`${baseMod}/tips/pending`)
        .set('Authorization', `Bearer ${modToken}`)
        .query({ skip: 0, take: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);

      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
    });

    it('retourne liste vide si aucun tip', async () => {
      const { token: modToken } = await createModerator('mod5');

      const res = await request(app)
        .get(`${baseMod}/tips/pending`)
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /moderation/stats', () => {
    it('retourne stats moderation', async () => {
      const { token: modToken } = await createModerator('mod6');
      const { userId } = await createAndLoginUser('author2');

      await createPendingTip(userId);
      await createPendingTip(userId);

      const res = await request(app)
        .get(`${baseMod}/stats`)
        .set('Authorization', `Bearer ${modToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('pendingTips');
      expect(res.body.data).toHaveProperty('pendingReports');
      expect(res.body.data).toHaveProperty('totalModerators');
      expect(res.body.data).toHaveProperty('totalActions');

      expect(res.body.data.pendingTips).toBeGreaterThanOrEqual(2);
      expect(res.body.data.totalModerators).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /moderation/reports/:id/resolve', () => {
    it('resout un report et rejette le tip', async () => {
      const { userId: authorId } = await createAndLoginUser('author3');
      const { token: modToken, userId: modId } = await createModerator('mod7');
      const { userId: reporterId } = await createAndLoginUser('reporter1');

      const tipId = await createPendingTip(authorId);
      const report = await createReport(tipId, reporterId);

      const res = await request(app)
        .post(`${baseMod}/reports/${report.id}/resolve`)
        .set('Authorization', `Bearer ${modToken}`)
        .send({ action: 'REJECT', reason: 'Spam content' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('REJECT');

      const updatedReport = await prisma.report.findUnique({ where: { id: report.id } });
      expect(updatedReport?.status).toBe('RESOLVED');

      const tip = await prisma.tip.findUnique({ where: { id: tipId } });
      expect(tip?.status).toBe('REJECTED');
    });

    it('erreur si report existe pas', async () => {
      const { token: modToken } = await createModerator('mod8');

      const res = await request(app)
        .post(`${baseMod}/reports/99999/resolve`)
        .set('Authorization', `Bearer ${modToken}`)
        .send({ action: 'APPROVE' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /moderation/reports', () => {
    it('retourne liste reports ouverts', async () => {
      const { token: modToken } = await createModerator('mod9');
      const { userId } = await createAndLoginUser('author4');
      const { userId: reporterId } = await createAndLoginUser('reporter2');

      const tipId1 = await createPendingTip(userId);
      const tipId2 = await createPendingTip(userId);

      await createReport(tipId1, reporterId);
      await createReport(tipId2, reporterId);

      const res = await request(app)
        .get(`${baseMod}/reports`)
        .set('Authorization', `Bearer ${modToken}`)
        .query({ skip: 0, take: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /moderation/users/promote', () => {
    it('promeut user en moderateur', async () => {
      const { token: adminToken } = await createAdmin('admin1');
      const { userId: targetUserId } = await createAndLoginUser('target1');

      const res = await request(app)
        .post(`${baseMod}/users/promote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUserId, role: 'MODERATOR' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('MODERATOR');

      const moderator = await prisma.moderator.findUnique({
        where: { userId: targetUserId },
      });
      expect(moderator).toBeDefined();
      expect(moderator?.isActive).toBe(true);

      const action = await prisma.moderationAction.findFirst({
        where: { actionType: 'PROMOTE_TO_MODERATOR', userId: targetUserId },
      });
      expect(action).toBeDefined();
    });

    it('bloque si pas admin', async () => {
      const { token: modToken } = await createModerator('mod10');
      const { userId: targetUserId } = await createAndLoginUser('target2');

      const res = await request(app)
        .post(`${baseMod}/users/promote`)
        .set('Authorization', `Bearer ${modToken}`)
        .send({ userId: targetUserId, role: 'MODERATOR' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /moderation/users/demote', () => {
    it('degrade un moderateur', async () => {
      const { token: adminToken } = await createAdmin('admin2');
      const { userId: modUserId } = await createModerator('demoteme');

      const res = await request(app)
        .post(`${baseMod}/users/demote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: modUserId, reason: 'Inactive moderator' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const moderator = await prisma.moderator.findUnique({
        where: { userId: modUserId },
      });
      expect(moderator?.isActive).toBe(false);

      const action = await prisma.moderationAction.findFirst({
        where: { actionType: 'DEMOTE_MODERATOR', userId: modUserId },
      });
      expect(action).toBeDefined();
      expect(action?.reason).toBe('Inactive moderator');
    });

    it('erreur si user pas moderateur', async () => {
      const { token: adminToken } = await createAdmin('admin3');
      const { userId: regularUserId } = await createAndLoginUser('notmod');

      const res = await request(app)
        .post(`${baseMod}/users/demote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: regularUserId, reason: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /moderation/history', () => {
    it('retourne historique actions moderateur', async () => {
      const { token: modToken, userId: modId } = await createModerator('mod11');
      const { userId } = await createAndLoginUser('author5');

      const tipId = await createPendingTip(userId);

      await request(app)
        .post(`${baseMod}/tips/${tipId}/approve`)
        .set('Authorization', `Bearer ${modToken}`);

      const res = await request(app)
        .get(`${baseMod}/history`)
        .set('Authorization', `Bearer ${modToken}`)
        .query({ limit: 50 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const approveAction = res.body.data.find(
        (action: any) => action.actionType === 'APPROVE_TIP',
      );
      expect(approveAction).toBeDefined();
    });
  });
});
