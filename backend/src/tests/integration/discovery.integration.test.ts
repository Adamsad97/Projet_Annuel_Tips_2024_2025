import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import { PREVIEW_LENGTH } from '../../modules/tips/tip.service';

describe('Guest preview, trending and category follow Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;
  const LONG_CONTENT = 'Contenu détaillé du tip. '.repeat(30);

  const clearAll = async () => {
    await prisma.notification.deleteMany();
    await prisma.categoryFollow.deleteMany();
    await prisma.moderationAction.deleteMany();
    await prisma.moderator.deleteMany();
    await clearTips();
    await clearUsers();
  };

  beforeAll(async () => {
    await seedBadges();
    for (const name of ['Cuisine', 'Jardinage']) {
      await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    }
    await clearAll();
  });

  afterEach(clearAll);

  afterAll(async () => {
    await disconnectPrisma();
  });

  const createUser = async (name: string, moderator = false) => {
    const email = `${name}@test.com`;
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({ email, password: 'Password123!', username: name });
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    if (moderator) await prisma.moderator.create({ data: { userId: user.id } });
    const login = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email, password: 'Password123!' });
    return { id: user.id, auth: { Authorization: `Bearer ${login.body.data.accessToken}` } };
  };

  const categoryId = async (name: string) =>
    (await prisma.category.findUniqueOrThrow({ where: { name } })).id;

  const createTip = async (
    userId: number,
    data: { status?: 'APPROVED' | 'PENDING'; categories?: string[]; createdAt?: Date } = {},
  ) => {
    const categoryIds = await Promise.all((data.categories ?? []).map(categoryId));
    return prisma.tip.create({
      data: {
        title: 'Un tip de test',
        content: LONG_CONTENT,
        images: ['/uploads/tips/photo.jpg'],
        status: data.status ?? 'APPROVED',
        createdAt: data.createdAt,
        userId,
        categories: { create: categoryIds.map((id) => ({ categoryId: id })) },
      },
    });
  };

  describe('Guest preview', () => {
    it('should only show the beginning of tips to guests', async () => {
      const author = await createUser('author');
      const reader = await createUser('reader');
      const tip = await createTip(author.id);

      const guestList = await request(app).get(api + ROUTES.tips.base);
      expect(guestList.body.data[0].isPreview).toBe(true);
      expect(guestList.body.data[0].content.length).toBeLessThanOrEqual(PREVIEW_LENGTH + 1);

      const guestDetail = await request(app).get(`${api}/tips/${tip.id}`);
      expect(guestDetail.status).toBe(200);
      expect(guestDetail.body.data).toMatchObject({ isPreview: true, images: [] });
      expect(guestDetail.body.data).not.toHaveProperty('comments');

      const memberDetail = await request(app).get(`${api}/tips/${tip.id}`).set(reader.auth);
      expect(memberDetail.body.data.content).toBe(LONG_CONTENT);
      expect(memberDetail.body.data.isPreview).toBeUndefined();

      const guestComments = await request(app).get(`${api}/tips/${tip.id}/comments`);
      expect(guestComments.status).toBe(401);
    });

    it('should hide unpublished tips from everyone but the author and moderators', async () => {
      const author = await createUser('author');
      const other = await createUser('other');
      const moderator = await createUser('modo', true);
      const tip = await createTip(author.id, { status: 'PENDING' });
      const get = (auth?: Record<string, string>) => {
        const req = request(app).get(`${api}/tips/${tip.id}`);
        return auth ? req.set(auth) : req;
      };

      expect((await get()).status).toBe(404);
      expect((await get(other.auth)).status).toBe(404);
      expect((await get(author.auth)).status).toBe(200);
      expect((await get(moderator.auth)).status).toBe(200);
    });

    it('should count one view per member and every guest visit', async () => {
      const author = await createUser('author');
      const reader = await createUser('reader');
      const tip = await createTip(author.id);

      await request(app).get(`${api}/tips/${tip.id}`).set(reader.auth);
      await request(app).get(`${api}/tips/${tip.id}`).set(reader.auth);
      await request(app).get(`${api}/tips/${tip.id}`);

      expect(await prisma.tipsView.count({ where: { tipId: tip.id } })).toBe(2);
    });
  });

  describe('Trending', () => {
    it('should rank tips by recent activity', async () => {
      const author = await createUser('author');
      const fan = await createUser('fan');
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const popular = await createTip(author.id, { createdAt: oldDate });
      const quiet = await createTip(author.id);
      const forgotten = await createTip(author.id, { createdAt: oldDate });

      await prisma.vote.create({ data: { userId: fan.id, tipId: popular.id, value: 1 } });
      // Score 3 (vote) + 2x2 (commentaires) = 7, au-dessus du bonus de nouveauté (5) du tip récent
      for (const content of ['Génial', 'Merci !']) {
        await prisma.comment.create({ data: { userId: fan.id, tipId: popular.id, content } });
      }

      const res = await request(app).get(`${api}/tips/trending?days=7`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((tip: { id: number }) => tip.id);
      expect(ids[0]).toBe(popular.id);
      expect(ids).toContain(quiet.id);
      expect(ids).not.toContain(forgotten.id);
      expect(res.body.data[0].trending).toMatchObject({ upvotes: 1, comments: 2 });
      expect(res.body.data[0].isPreview).toBe(true);

      expect((await request(app).get(`${api}/tips/trending?days=3`)).status).toBe(400);
    });
  });

  describe('Category follow', () => {
    it('should follow and unfollow categories', async () => {
      const user = await createUser('follower');
      const cuisine = await categoryId('Cuisine');

      expect(
        (await request(app).post(`${api}/categories/${cuisine}/follow`).set(user.auth)).status,
      ).toBe(200);

      const list = await request(app).get(`${api}/categories`).set(user.auth);
      const entry = list.body.data.find((c: { id: number }) => c.id === cuisine);
      expect(entry).toMatchObject({ isFollowed: true, tipsCount: 0 });

      const followed = await request(app).get(`${api}/categories/followed`).set(user.auth);
      expect(followed.body.data.map((c: { name: string }) => c.name)).toEqual(['Cuisine']);

      await request(app).delete(`${api}/categories/${cuisine}/follow`).set(user.auth);
      const after = await request(app).get(`${api}/categories/followed`).set(user.auth);
      expect(after.body.data).toHaveLength(0);

      const guest = await request(app).get(`${api}/categories`);
      expect(guest.status).toBe(200);
      expect(guest.body.data.every((c: { isFollowed: boolean }) => !c.isFollowed)).toBe(true);
    });

    it('should notify followers once when a tip is published in their categories', async () => {
      const author = await createUser('author');
      const follower = await createUser('follower');
      const moderator = await createUser('modo', true);

      for (const name of ['Cuisine', 'Jardinage']) {
        await request(app)
          .post(`${api}/categories/${await categoryId(name)}/follow`)
          .set(follower.auth);
        await request(app)
          .post(`${api}/categories/${await categoryId(name)}/follow`)
          .set(author.auth);
      }

      const tip = await createTip(author.id, {
        status: 'PENDING',
        categories: ['Cuisine', 'Jardinage'],
      });
      const approve = await request(app)
        .post(`${api}/moderation/tips/${tip.id}/approve`)
        .set(moderator.auth);
      expect(approve.status).toBe(200);

      const followerNotifications = await prisma.notification.findMany({
        where: { userId: follower.id, type: 'NEW_TIP' },
      });
      expect(followerNotifications).toHaveLength(1);
      expect(followerNotifications[0]).toMatchObject({
        body: 'Un tip de test',
        link: `/tips/${tip.id}`,
      });

      // L'auteur n'est pas notifié de son propre tip
      expect(
        await prisma.notification.count({ where: { userId: author.id, type: 'NEW_TIP' } }),
      ).toBe(0);
    });
  });
});
