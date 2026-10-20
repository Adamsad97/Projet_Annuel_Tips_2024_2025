import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import { trustService } from '../../modules/trust/trust.service';
import { xpService } from '../../modules/xp/xp.service';
import { XpAction } from '../../types/xp.types';
import { TRUST_BASE, TRUST_RULES } from '../../modules/trust/trust.config';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('Trust index Integration', () => {
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
    return { id: user.id, auth: { Authorization: `Bearer ${login.body.data.accessToken}` } };
  };

  const createApprovedTips = async (userId: number, count: number) => {
    for (let i = 0; i < count; i++) {
      await prisma.tip.create({
        data: { title: `Tip ${i}`, content: 'Contenu de test', status: 'APPROVED', userId },
      });
    }
  };

  it('should give a newcomer an index close to the base', async () => {
    const user = await createUser('newbie');

    const breakdown = await trustService.computeBreakdown(user.id);

    expect(breakdown.computed).toBeGreaterThanOrEqual(TRUST_BASE);
    expect(breakdown.computed).toBeLessThan(TRUST_BASE + 10);
    expect(breakdown.factors.map((f) => f.key)).toContain('publishedTips');
  });

  it('should reward good contributions and penalise sanctions', async () => {
    const author = await createUser('author');
    const voter = await createUser('voter');
    const troll = await createUser('troll');
    const moderator = await createUser('modo', 'MODERATOR');

    await createApprovedTips(author.id, 5);
    const tips = await prisma.tip.findMany({ where: { userId: author.id } });
    for (const tip of tips) {
      await prisma.vote.create({ data: { userId: voter.id, tipId: tip.id, value: 1 } });
    }

    await request(app)
      .post(`${api}/moderation/users/${troll.id}/warn`)
      .set(moderator.auth)
      .send({ reason: 'Comportement toxique' });

    const good = await trustService.recomputeUser(author.id);
    const bad = await trustService.recomputeUser(troll.id);

    expect(good).toBeGreaterThan(TRUST_BASE + 5);
    expect(bad).toBeLessThan(TRUST_BASE);
  });

  it('should ignore sanctions cancelled by an admin', async () => {
    const user = await createUser('member');
    const moderator = await createUser('modo', 'MODERATOR');
    const warn = await request(app)
      .post(`${api}/moderation/users/${user.id}/warn`)
      .set(moderator.auth)
      .send({ reason: 'Avertissement contesté' });
    const sanctioned = await trustService.recomputeUser(user.id);

    await prisma.moderationAction.update({
      where: { id: warn.body.data.id },
      data: { overturnedAt: new Date() },
    });

    expect(await trustService.recomputeUser(user.id)).toBeGreaterThan(sanctioned);
  });

  it('should keep the admin manual adjustment across recomputations', async () => {
    const admin = await createUser('boss', 'ADMIN');
    const user = await createUser('member');

    const res = await request(app)
      .patch(`${api}/admin/users/${user.id}/trust-index`)
      .set(admin.auth)
      .send({ trustIndex: 90, reason: 'Compte vérifié manuellement' });
    expect(res.status).toBe(200);
    expect(res.body.data.metadata).toMatchObject({ next: 90 });

    await trustService.runCycle();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).trustIndex).toBe(90);

    const breakdown = await request(app).get(`${api}/admin/users/${user.id}/trust`).set(admin.auth);
    expect(breakdown.status).toBe(200);
    expect(breakdown.body.data.trustIndex).toBe(90);
    expect(breakdown.body.data.adjustment).toBe(90 - breakdown.body.data.computed);
  });

  it('should block grade promotion for untrusted accounts', async () => {
    const troll = await createUser('troll');
    const member = await createUser('member');

    await prisma.user.update({
      where: { id: troll.id },
      data: { trustIndex: TRUST_RULES.minTrustForGradePromotion - 1 },
    });

    await xpService.addXp(troll.id, XpAction.TIP_APPROVED, 60);
    await xpService.addXp(member.id, XpAction.TIP_APPROVED, 60);

    // Plusieurs grades peuvent partager le seuil de 50 XP (données de référence + grades de test)
    const gradeOf = async (id: number) =>
      (await prisma.user.findUniqueOrThrow({ where: { id }, include: { grade: true } })).grade;
    expect((await gradeOf(troll.id))?.xpRequired ?? 0).toBe(0);
    expect((await gradeOf(member.id))?.xpRequired).toBe(50);
  });

  it('should automatically promote a trusted and active member to moderator', async () => {
    const user = await createUser('star');
    const rules = TRUST_RULES.autoPromotion;
    await createApprovedTips(user.id, rules.minPublishedTips);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: rules.minXp,
        createdAt: new Date(Date.now() - (rules.minAccountAgeDays + 1) * DAY_MS),
        trustAdjustment: 100,
      },
    });

    const summary = await trustService.runCycle();

    expect(summary.promoted).toContain(user.id);
    const moderator = await prisma.moderator.findUnique({ where: { userId: user.id } });
    expect(moderator?.isActive).toBe(true);
    const action = await prisma.moderationAction.findFirstOrThrow({
      where: { userId: user.id, actionType: 'AUTO_PROMOTE' },
    });
    expect(action.moderatorId).toBeNull();
  });

  it('should demote untrusted moderators and list fragile ones for the admin', async () => {
    const admin = await createUser('boss', 'ADMIN');
    const bad = await createUser('badmodo', 'MODERATOR');
    const idle = await createUser('idlemodo', 'MODERATOR');
    await prisma.user.update({ where: { id: bad.id }, data: { trustAdjustment: -100 } });

    const summary = await trustService.runCycle();

    expect(summary.demoted).toContain(bad.id);
    expect((await prisma.moderator.findUnique({ where: { userId: bad.id } }))?.isActive).toBe(
      false,
    );

    const watchlist = await request(app).get(`${api}/admin/trust/watchlist`).set(admin.auth);
    expect(watchlist.status).toBe(200);
    const idleEntry = watchlist.body.data.find((m: { id: number }) => m.id === idle.id);
    expect(idleEntry.reasons[0]).toContain('Aucune action');
  });

  it('should let the admin compare users by trust index', async () => {
    const admin = await createUser('boss', 'ADMIN');
    const low = await createUser('low');
    await prisma.user.update({ where: { id: low.id }, data: { trustIndex: 5 } });

    const sorted = await request(app).get(`${api}/admin/users?sort=trust-asc`).set(admin.auth);
    expect(sorted.body.data.items[0].id).toBe(low.id);

    const ranking = await request(app).get(`${api}/admin/trust/ranking`).set(admin.auth);
    expect(ranking.status).toBe(200);
    expect(ranking.body.data.lowest[0].id).toBe(low.id);

    const recompute = await request(app).post(`${api}/admin/trust/recompute`).set(admin.auth);
    expect(recompute.status).toBe(200);
    expect(recompute.body.data.usersUpdated).toBeGreaterThanOrEqual(2);
  });
});
