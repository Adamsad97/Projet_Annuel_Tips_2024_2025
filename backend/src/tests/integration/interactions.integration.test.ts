import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

describe('Comments, votes and reports Integration', () => {
  const api = ROUTES.api;
  const baseAuth = api + ROUTES.users.base;

  beforeAll(async () => {
    await seedBadges();
    await clearTips();
    await clearUsers();
  });

  afterEach(async () => {
    await clearTips();
    await clearUsers();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  const createAndLoginUser = async (name: string) => {
    const payload = {
      email: `${name}@test.com`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      username: name,
      firstname: 'Test',
      lastname: 'User',
    };
    await request(app)
      .post(baseAuth + ROUTES.users.register)
      .send(payload);
    const loginRes = await request(app)
      .post(baseAuth + ROUTES.users.login)
      .send({ email: payload.email, password: payload.password });

    return {
      token: loginRes.body.data.accessToken as string,
      userId: loginRes.body.data.user.id as number,
    };
  };

  const createPublishedTip = async (token: string) => {
    const res = await request(app)
      .post(api + ROUTES.tips.base)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Published tip', content: 'Content of the published tip' });
    await prisma.tip.update({ where: { id: res.body.data.id }, data: { status: 'APPROVED' } });
    return res.body.data.id as number;
  };

  const getXp = async (userId: number) =>
    (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).xp;

  describe('Comments', () => {
    it('should create, list (with replies), update and delete comments', async () => {
      const author = await createAndLoginUser('author');
      const reader = await createAndLoginUser('reader');
      const tipId = await createPublishedTip(author.token);

      const created = await request(app)
        .post(`${api}/tips/${tipId}/comments`)
        .set('Authorization', `Bearer ${reader.token}`)
        .send({ content: 'Great tip, thanks!' });
      expect(created.status).toBe(201);
      const commentId = created.body.data.id;

      const reply = await request(app)
        .post(`${api}/tips/${tipId}/comments`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ content: 'You are welcome', parentId: commentId });
      expect(reply.status).toBe(201);

      // Une réponse à une réponse est rattachée au commentaire racine
      const nested = await request(app)
        .post(`${api}/tips/${tipId}/comments`)
        .set('Authorization', `Bearer ${reader.token}`)
        .send({ content: 'Nested reply', parentId: reply.body.data.id });
      expect(nested.body.data.parentId).toBe(commentId);

      const list = await request(app).get(`${api}/tips/${tipId}/comments`);
      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.data[0].replies).toHaveLength(2);

      const forbidden = await request(app)
        .patch(`${api}/comments/${commentId}`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ content: 'Hijacked' });
      expect(forbidden.status).toBe(403);

      const updated = await request(app)
        .patch(`${api}/comments/${commentId}`)
        .set('Authorization', `Bearer ${reader.token}`)
        .send({ content: 'Great tip, thanks a lot!' });
      expect(updated.status).toBe(200);
      expect(updated.body.data.content).toBe('Great tip, thanks a lot!');

      const deleted = await request(app)
        .delete(`${api}/comments/${commentId}`)
        .set('Authorization', `Bearer ${reader.token}`);
      expect(deleted.status).toBe(200);

      const afterDelete = await request(app).get(`${api}/tips/${tipId}/comments`);
      expect(afterDelete.body.data).toHaveLength(0);
    });

    it('should give XP for a comment and refuse comments on unpublished tips', async () => {
      const author = await createAndLoginUser('author2');
      const reader = await createAndLoginUser('reader2');

      const pending = await request(app)
        .post(api + ROUTES.tips.base)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ title: 'Pending tip', content: 'Not yet approved content' });

      const refused = await request(app)
        .post(`${api}/tips/${pending.body.data.id}/comments`)
        .set('Authorization', `Bearer ${reader.token}`)
        .send({ content: 'Too early' });
      expect(refused.status).toBe(400);

      const tipId = await createPublishedTip(author.token);
      const xpBefore = await getXp(reader.userId);
      await request(app)
        .post(`${api}/tips/${tipId}/comments`)
        .set('Authorization', `Bearer ${reader.token}`)
        .send({ content: 'Nice one' });
      expect(await getXp(reader.userId)).toBe(xpBefore + 5);
    });

    it('should require authentication to comment', async () => {
      const author = await createAndLoginUser('author3');
      const tipId = await createPublishedTip(author.token);

      const res = await request(app)
        .post(`${api}/tips/${tipId}/comments`)
        .send({ content: 'Anonymous' });
      expect(res.status).toBe(401);
    });
  });

  describe('Votes', () => {
    it('should upvote, switch, remove a vote and keep author XP consistent', async () => {
      const author = await createAndLoginUser('voteauthor');
      const voter = await createAndLoginUser('voter');
      const tipId = await createPublishedTip(author.token);
      const xpBefore = await getXp(author.userId);

      const vote = (value: number) =>
        request(app)
          .post(`${api}/tips/${tipId}/votes`)
          .set('Authorization', `Bearer ${voter.token}`)
          .send({ value });

      const up = await vote(1);
      expect(up.status).toBe(200);
      expect(up.body.data).toEqual({ upvotes: 1, downvotes: 0, score: 1, userVote: 1 });
      expect(await getXp(author.userId)).toBe(xpBefore + 2);

      // Revoter +1 ne change rien
      await vote(1);
      expect(await getXp(author.userId)).toBe(xpBefore + 2);

      const down = await vote(-1);
      expect(down.body.data).toEqual({ upvotes: 0, downvotes: 1, score: -1, userVote: -1 });
      expect(await getXp(author.userId)).toBe(xpBefore - 1);

      const removed = await vote(0);
      expect(removed.body.data).toEqual({ upvotes: 0, downvotes: 0, score: 0, userVote: 0 });
      expect(await getXp(author.userId)).toBe(xpBefore);

      expect(await prisma.vote.count({ where: { tipId } })).toBe(0);
    });

    it('should expose the vote summary on tip detail', async () => {
      const author = await createAndLoginUser('detailauthor');
      const voter = await createAndLoginUser('detailvoter');
      const tipId = await createPublishedTip(author.token);

      await request(app)
        .post(`${api}/tips/${tipId}/votes`)
        .set('Authorization', `Bearer ${voter.token}`)
        .send({ value: 1 });

      const anonymous = await request(app).get(`${api}/tips/${tipId}`);
      expect(anonymous.body.data.votes).toEqual({
        upvotes: 1,
        downvotes: 0,
        score: 1,
        userVote: 0,
      });

      const asVoter = await request(app)
        .get(`${api}/tips/${tipId}`)
        .set('Authorization', `Bearer ${voter.token}`);
      expect(asVoter.body.data.votes.userVote).toBe(1);
    });

    it('should forbid voting on own content and invalid values', async () => {
      const author = await createAndLoginUser('selfvoter');
      const tipId = await createPublishedTip(author.token);

      const own = await request(app)
        .post(`${api}/tips/${tipId}/votes`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ value: 1 });
      expect(own.status).toBe(403);

      const invalid = await request(app)
        .post(`${api}/tips/${tipId}/votes`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ value: 5 });
      expect(invalid.status).toBe(400);
    });

    it('should vote on comments and reflect score in comment list', async () => {
      const author = await createAndLoginUser('cvauthor');
      const commenter = await createAndLoginUser('cvcommenter');
      const tipId = await createPublishedTip(author.token);

      const comment = await request(app)
        .post(`${api}/tips/${tipId}/comments`)
        .set('Authorization', `Bearer ${commenter.token}`)
        .send({ content: 'Vote for me' });

      const res = await request(app)
        .post(`${api}/comments/${comment.body.data.id}/votes`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ value: 1 });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(1);

      const list = await request(app)
        .get(`${api}/tips/${tipId}/comments`)
        .set('Authorization', `Bearer ${author.token}`);
      expect(list.body.data[0].score).toBe(1);
      expect(list.body.data[0].userVote).toBe(1);
    });
  });

  describe('Reports', () => {
    it('should report a tip once and show it in moderation queue data', async () => {
      const author = await createAndLoginUser('reportedauthor');
      const reporter = await createAndLoginUser('reporter');
      const tipId = await createPublishedTip(author.token);

      const report = () =>
        request(app)
          .post(`${api}/tips/${tipId}/reports`)
          .set('Authorization', `Bearer ${reporter.token}`)
          .send({ reason: 'Contenu trompeur' });

      const first = await report();
      expect(first.status).toBe(201);
      expect(first.body.data.status).toBe('OPEN');

      const duplicate = await report();
      expect(duplicate.status).toBe(409);

      expect(await prisma.report.count({ where: { tipId, status: 'OPEN' } })).toBe(1);
    });

    it('should report a comment and refuse self reports or short reasons', async () => {
      const author = await createAndLoginUser('creportauthor');
      const commenter = await createAndLoginUser('creporter');
      const tipId = await createPublishedTip(author.token);

      const comment = await request(app)
        .post(`${api}/tips/${tipId}/comments`)
        .set('Authorization', `Bearer ${commenter.token}`)
        .send({ content: 'Spam spam spam' });
      const commentId = comment.body.data.id;

      const ok = await request(app)
        .post(`${api}/comments/${commentId}/reports`)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ reason: 'Spam évident' });
      expect(ok.status).toBe(201);

      const self = await request(app)
        .post(`${api}/comments/${commentId}/reports`)
        .set('Authorization', `Bearer ${commenter.token}`)
        .send({ reason: 'Je me signale' });
      expect(self.status).toBe(403);

      const short = await request(app)
        .post(`${api}/tips/${tipId}/reports`)
        .set('Authorization', `Bearer ${commenter.token}`)
        .send({ reason: 'no' });
      expect(short.status).toBe(400);
    });
  });
});
