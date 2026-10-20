import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString();

describe('Sponsored tips and sponsored challenges Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;

  const clearAll = async () => {
    await prisma.adCampaign.deleteMany();
    await prisma.sponsoredChallenge.deleteMany();
    await prisma.featureFlag.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.categoryFollow.deleteMany();
    await prisma.moderationAction.deleteMany();
    await prisma.moderator.deleteMany();
    await prisma.admin.deleteMany();
    await clearTips();
    await clearUsers();
  };

  let cuisineId: number;
  let jardinageId: number;

  beforeAll(async () => {
    await seedBadges();
    cuisineId = (
      await prisma.category.upsert({
        where: { name: 'Cuisine' },
        update: {},
        create: { name: 'Cuisine' },
      })
    ).id;
    jardinageId = (
      await prisma.category.upsert({
        where: { name: 'Jardinage' },
        update: {},
        create: { name: 'Jardinage' },
      })
    ).id;
    await clearAll();
  });

  afterEach(clearAll);
  afterAll(async () => {
    await disconnectPrisma();
  });

  const createUser = async (name: string, role?: 'ADMIN' | 'MODERATOR') => {
    const email = `${name}@test.com`;
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({ email, password: 'Password123!', username: name });
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    if (role === 'ADMIN') await prisma.admin.create({ data: { userId: user.id } });
    if (role === 'MODERATOR') await prisma.moderator.create({ data: { userId: user.id } });
    const login = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email, password: 'Password123!' });
    return { id: user.id, auth: { Authorization: `Bearer ${login.body.data.accessToken}` } };
  };

  const campaign = (overrides: Record<string, unknown> = {}) => ({
    name: 'Campagne test',
    sponsorName: 'Brico+',
    title: 'Les meilleurs outils de jardin',
    body: 'Découvrez notre gamme d’outils robustes pour le jardin.',
    targetUrl: 'https://partenaire.example.com/promo',
    status: 'ACTIVE',
    startsAt: daysFromNow(-1),
    ...overrides,
  });

  const createCampaign = async (admin: { auth: Record<string, string> }, overrides = {}) => {
    const res = await request(app)
      .post(`${api}/admin/ads`)
      .set(admin.auth)
      .send(campaign(overrides));
    expect(res.status).toBe(201);
    return res.body.data.id as number;
  };

  const placement = (query = '', auth?: Record<string, string>) => {
    const req = request(app).get(`${api}/ads/placement${query}`);
    return auth ? req.set(auth) : req;
  };

  describe('Sponsored tips', () => {
    it('should serve only active campaigns, with public fields, and count impressions', async () => {
      const admin = await createUser('boss', 'ADMIN');
      expect((await placement()).body.data).toBeNull();

      await createCampaign(admin, { status: 'DRAFT' });
      await createCampaign(admin, {
        status: 'ACTIVE',
        endsAt: daysFromNow(-0.5),
        startsAt: daysFromNow(-2),
      });
      expect((await placement()).body.data).toBeNull();

      const id = await createCampaign(admin);
      const res = await placement();
      expect(res.body.data).toEqual({
        id,
        sponsorName: 'Brico+',
        title: 'Les meilleurs outils de jardin',
        body: 'Découvrez notre gamme d’outils robustes pour le jardin.',
        imageUrl: null,
      });

      const stats = await request(app).get(`${api}/admin/ads/${id}/stats`).set(admin.auth);
      expect(stats.body.data.totals).toMatchObject({ impressions: 1, clicks: 0 });

      // Déjà affichée sur la page : on ne la repropose pas
      expect((await placement(`?exclude=${id}`)).body.data).toBeNull();
    });

    it('should target categories, followed categories, audience and grades', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const member = await createUser('member');
      await createCampaign(admin, { targetCategoryIds: [cuisineId] });

      expect((await placement(`?categoryId=${jardinageId}`)).body.data).toBeNull();
      expect((await placement(`?categoryId=${cuisineId}`)).body.data).not.toBeNull();
      // Sans contexte : visiteur non ciblé, membre ciblé via ses catégories suivies
      expect((await placement()).body.data).toBeNull();
      await request(app).post(`${api}/categories/${cuisineId}/follow`).set(member.auth);
      expect((await placement('', member.auth)).body.data).not.toBeNull();

      await prisma.adCampaign.deleteMany();
      await createCampaign(admin, { audience: 'MEMBERS' });
      expect((await placement()).body.data).toBeNull();
      expect((await placement('', member.auth)).body.data).not.toBeNull();

      await prisma.adCampaign.deleteMany();
      const grade = await prisma.grade.upsert({
        where: { name: 'Débutant' },
        update: {},
        create: { name: 'Débutant', xpRequired: 0 },
      });
      await createCampaign(admin, { targetGradeIds: [grade.id] });
      expect((await placement('', member.auth)).body.data).toBeNull();
      await prisma.user.update({ where: { id: member.id }, data: { gradeId: grade.id } });
      expect((await placement('', member.auth)).body.data).not.toBeNull();
    });

    it('should stop serving once the impression budget is reached', async () => {
      const admin = await createUser('boss', 'ADMIN');
      await createCampaign(admin, { maxImpressions: 1 });

      expect((await placement()).body.data).not.toBeNull();
      expect((await placement()).body.data).toBeNull();
    });

    it('should count clicks, redirect to the partner and export stats as CSV', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const id = await createCampaign(admin);
      await placement();
      await placement();

      const click = await request(app).get(`${api}/ads/${id}/click`);
      expect(click.status).toBe(302);
      expect(click.headers.location).toBe('https://partenaire.example.com/promo');

      const stats = await request(app).get(`${api}/admin/ads/${id}/stats`).set(admin.auth);
      expect(stats.body.data.totals).toEqual({ impressions: 2, clicks: 1, ctr: 50 });
      expect(stats.body.data.days).toHaveLength(1);

      const csv = await request(app).get(`${api}/admin/ads/${id}/stats.csv`).set(admin.auth);
      expect(csv.status).toBe(200);
      expect(csv.headers['content-type']).toContain('text/csv');
      expect(csv.headers['content-disposition']).toContain('campagne-');
      expect(csv.text).toContain('jour;affichages;clics;taux_de_clic_%');
      expect(csv.text).toContain('total;2;1;50');

      const list = await request(app).get(`${api}/admin/ads`).set(admin.auth);
      expect(list.body.data[0].totals).toEqual({ impressions: 2, clicks: 1, ctr: 50 });
    });

    it('should serve nothing when the ads feature is off', async () => {
      const admin = await createUser('boss', 'ADMIN');
      await createCampaign(admin);
      await request(app)
        .patch(`${api}/admin/features/ads`)
        .set(admin.auth)
        .send({ enabled: false });

      const res = await placement();
      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('should validate campaigns and restrict administration to admins', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const member = await createUser('member');

      const insecure = await request(app)
        .post(`${api}/admin/ads`)
        .set(admin.auth)
        .send(campaign({ targetUrl: 'http://partenaire.example.com' }));
      expect(insecure.status).toBe(400);

      const badDates = await request(app)
        .post(`${api}/admin/ads`)
        .set(admin.auth)
        .send(campaign({ startsAt: daysFromNow(2), endsAt: daysFromNow(1) }));
      expect(badDates.status).toBe(400);

      expect((await request(app).get(`${api}/admin/ads`).set(member.auth)).status).toBe(403);
      expect((await request(app).get(`${api}/ads/999999/click`)).status).toBe(404);
    });
  });

  describe('Sponsored challenges', () => {
    const createChallenge = async (
      admin: { auth: Record<string, string> },
      overrides: Record<string, unknown> = {},
    ) => {
      const res = await request(app)
        .post(`${api}/admin/challenges`)
        .set(admin.auth)
        .send({
          sponsorName: 'Jardiland',
          title: 'Semaine du jardinage',
          description: 'Partagez une astuce de jardinage validée pendant la semaine.',
          categoryId: jardinageId,
          xpBonus: 50,
          startsAt: daysFromNow(-1),
          endsAt: daysFromNow(6),
          ...overrides,
        });
      expect(res.status).toBe(201);
      return res.body.data.id as number;
    };

    const submitAndApprove = async (
      author: { id: number },
      moderator: { auth: Record<string, string> },
      data: { categoryId?: number; kind?: 'TIP' | 'QUESTION'; createdAt?: Date } = {},
    ) => {
      const tip = await prisma.tip.create({
        data: {
          title: 'Astuce de jardinage',
          content: 'Paillez vos plantations pour garder l’humidité.',
          kind: data.kind ?? 'TIP',
          userId: author.id,
          createdAt: data.createdAt,
          categories: { create: [{ categoryId: data.categoryId ?? jardinageId }] },
        },
      });
      const res = await request(app)
        .post(`${api}/moderation/tips/${tip.id}/approve`)
        .set(moderator.auth);
      expect(res.status).toBe(200);
      return tip.id;
    };

    const xpOf = async (userId: number) =>
      (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).xp;

    it('should reward the first approved tip of the category once per member', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const moderator = await createUser('modo', 'MODERATOR');
      const author = await createUser('gardener');
      const challengeId = await createChallenge(admin);

      const xpBefore = await xpOf(author.id);
      await submitAndApprove(author, moderator);
      // +20 XP de validation du tip, +50 XP du défi
      expect(await xpOf(author.id)).toBe(xpBefore + 20 + 50);

      const notification = await prisma.notification.findFirst({
        where: { userId: author.id, type: 'CHALLENGE' },
      });
      expect(notification?.title).toBe('Défi réussi : +50 XP');

      await submitAndApprove(author, moderator);
      expect(await prisma.challengeReward.count({ where: { challengeId } })).toBe(1);

      const list = await request(app).get(`${api}/challenges`).set(author.auth);
      expect(list.body.data[0]).toMatchObject({
        id: challengeId,
        completedByMe: true,
        rewardsGiven: 1,
        category: { name: 'Jardinage' },
      });
    });

    it('should ignore other categories, questions and tips created before the challenge', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const moderator = await createUser('modo', 'MODERATOR');
      const author = await createUser('gardener');
      await createChallenge(admin);

      await submitAndApprove(author, moderator, { categoryId: cuisineId });
      await submitAndApprove(author, moderator, { kind: 'QUESTION' });
      await submitAndApprove(author, moderator, { createdAt: new Date(Date.now() - 3 * DAY_MS) });

      expect(await prisma.challengeReward.count()).toBe(0);
    });

    it('should stop rewarding once the sponsor budget is reached', async () => {
      const admin = await createUser('boss', 'ADMIN');
      const moderator = await createUser('modo', 'MODERATOR');
      const first = await createUser('first');
      const second = await createUser('second');
      await createChallenge(admin, { maxRewards: 1 });

      await submitAndApprove(first, moderator);
      await submitAndApprove(second, moderator);

      const rewards = await prisma.challengeReward.findMany();
      expect(rewards.map((reward) => reward.userId)).toEqual([first.id]);

      const list = await request(app).get(`${api}/challenges`);
      expect(list.body.data[0]).toMatchObject({ remainingRewards: 0, completedByMe: false });
    });
  });
});
