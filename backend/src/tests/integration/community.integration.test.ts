import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

describe('Community data Integration (stats, grades, contact, follow, leaderboard)', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;

  const clearAll = async () => {
    await prisma.contactMessage.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.admin.deleteMany();
    await clearTips();
    await clearUsers();
  };

  beforeAll(clearAll);
  afterEach(clearAll);
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

  const approvedTip = (userId: number, createdAt = new Date()) =>
    prisma.tip.create({
      data: { title: 'Astuce', content: 'Contenu', status: 'APPROVED', userId, createdAt },
    });

  it('GET /stats should return real counters', async () => {
    const author = await createUser('author');
    await approvedTip(author.id);
    await prisma.tip.create({ data: { title: 'En attente', userId: author.id } });
    await prisma.tip.create({
      data: { title: 'Question ?', kind: 'QUESTION', status: 'APPROVED', userId: author.id },
    });

    const res = await request(app).get(api + ROUTES.platform.stats);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ tips: 1, questions: 1, members: 1, activeMembers: 1 });
  });

  it('GET /grades should list grades by required XP', async () => {
    const res = await request(app).get(api + ROUTES.platform.grades);

    expect(res.status).toBe(200);
    const thresholds = res.body.data.map((grade: { xpRequired: number }) => grade.xpRequired);
    expect(thresholds).toEqual([...thresholds].sort((a, b) => a - b));
  });

  it('GET /xp-rules should expose the XP actually awarded', async () => {
    const res = await request(app).get(api + ROUTES.platform.xpRules);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ TIP_APPROVED: 20, COMMENT_CREATED: 5 });
  });

  it('should store a contact message and let an admin handle it', async () => {
    const admin = await createUser('boss', true);
    const member = await createUser('member');

    const invalid = await request(app)
      .post(api + ROUTES.platform.contact)
      .send({ name: 'Jo', email: 'pas-un-email', message: 'Bonjour' });
    expect(invalid.status).toBe(400);

    const sent = await request(app)
      .post(api + ROUTES.platform.contact)
      .send({ name: 'Jo', email: 'jo@example.com', message: 'Une question sur mon compte.' });
    expect(sent.status).toBe(201);

    const forbidden = await request(app).get(`${api}/admin/contact-messages`).set(member.auth);
    expect(forbidden.status).toBe(403);

    const open = await request(app).get(`${api}/admin/contact-messages`).set(admin.auth);
    expect(open.body.data).toHaveLength(1);
    const id = open.body.data[0].id;

    const handled = await request(app)
      .patch(`${api}/admin/contact-messages/${id}`)
      .set(admin.auth)
      .send({ handled: true });
    expect(handled.body.data.handledAt).not.toBeNull();

    const stillOpen = await request(app).get(`${api}/admin/contact-messages`).set(admin.auth);
    expect(stillOpen.body.data).toHaveLength(0);

    const removed = await request(app)
      .delete(`${api}/admin/contact-messages/${id}`)
      .set(admin.auth);
    expect(removed.status).toBe(200);
    expect(await prisma.contactMessage.count()).toBe(0);
  });

  it('should follow and unfollow a member, with notifications', async () => {
    const alice = await createUser('alice');
    const bob = await createUser('bob');
    const followUrl = `${baseUsers}/${bob.id}/follow`;

    const self = await request(app).post(`${baseUsers}/${alice.id}/follow`).set(alice.auth);
    expect(self.status).toBe(400);

    const followed = await request(app).post(followUrl).set(alice.auth);
    expect(followed.body.data).toEqual({ isFollowing: true, followers: 1 });
    // Suivre deux fois ne crée pas de doublon
    await request(app).post(followUrl).set(alice.auth);

    const profile = await request(app).get(`${baseUsers}/${bob.id}`).set(alice.auth);
    expect(profile.body.data.isFollowing).toBe(true);
    expect(profile.body.data.stats.followers).toBe(1);
    expect(
      await prisma.notification.count({ where: { userId: bob.id, type: 'NEW_FOLLOWER' } }),
    ).toBe(1);

    const unfollowed = await request(app).delete(followUrl).set(alice.auth);
    expect(unfollowed.body.data).toEqual({ isFollowing: false, followers: 0 });
  });

  it('should rank by XP, published tips or votes received, over a period', async () => {
    const veteran = await createUser('veteran');
    const writer = await createUser('writer');
    const voter = await createUser('voter');
    await prisma.user.update({ where: { id: veteran.id }, data: { xp: 5000 } });

    const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const oldTip = await approvedTip(veteran.id, old);
    await approvedTip(veteran.id, old);
    await approvedTip(writer.id);
    await prisma.vote.create({
      data: { value: 1, userId: voter.id, tipId: oldTip.id, createdAt: old },
    });
    const recentTip = await approvedTip(writer.id);
    await prisma.vote.create({ data: { value: 1, userId: voter.id, tipId: recentTip.id } });
    await prisma.vote.create({ data: { value: 1, userId: veteran.id, tipId: recentTip.id } });

    const rank = (query: string) =>
      request(app)
        .get(`${baseUsers}${ROUTES.users.leaderboard}?${query}`)
        .then((res) => res.body.data.map((row: { username: string }) => row.username));

    expect((await rank('sort=xp'))[0]).toBe('veteran');
    expect(await rank('sort=tips&period=all')).toEqual(['veteran', 'writer']);
    expect(await rank('sort=tips&period=week')).toEqual(['writer']);
    expect(await rank('sort=votes&period=all')).toEqual(['writer', 'veteran']);
    expect(await rank('sort=votes&period=month')).toEqual(['writer']);

    const [writerRow] = (
      await request(app).get(`${baseUsers}${ROUTES.users.leaderboard}?sort=votes&period=week`)
    ).body.data;
    expect(writerRow).toMatchObject({ rank: 1, tips: 2, votes: 2 });
  });

  it('should expose the author XP, grade and role with tips, never the email', async () => {
    const author = await createUser('author');
    await prisma.user.update({ where: { id: author.id }, data: { xp: 120 } });
    const tip = await approvedTip(author.id);

    const list = await request(app)
      .get(api + ROUTES.tips.base)
      .set(author.auth);
    const detail = await request(app).get(`${api}${ROUTES.tips.base}/${tip.id}`).set(author.auth);

    for (const user of [list.body.data[0].user, detail.body.data.user]) {
      expect(user).toMatchObject({ username: 'author', xp: 120, admin: null, moderator: null });
      expect(user).not.toHaveProperty('email');
    }
  });
});
