import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';

describe('Reported comments: removal and restoration on appeal Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;
  const PASSWORD = 'Password123!';

  const clearAll = async () => {
    await prisma.appeal.deleteMany();
    await prisma.moderationAction.deleteMany();
    await prisma.report.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.moderator.deleteMany();
    await prisma.admin.deleteMany();
    await clearTips();
    await clearUsers();
  };

  beforeAll(async () => {
    await seedBadges();
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

  it('should hide a reported comment everywhere and restore it when the appeal is accepted', async () => {
    const tipAuthor = await createUser('tipauthor');
    const commenter = await createUser('commenter');
    const reporter = await createUser('reporter');
    const moderator = await createUser('modo', 'MODERATOR');
    const admin = await createUser('admin', 'ADMIN');

    const tip = await prisma.tip.create({
      data: { userId: tipAuthor.id, status: 'APPROVED', title: 'Astuce', content: 'Contenu.' },
    });
    const commentsUrl = `${api}/tips/${tip.id}/comments`;

    const created = await request(app)
      .post(commentsUrl)
      .set(commenter.auth)
      .send({ content: 'Commentaire signalé' });
    const commentId = created.body.data.id as number;
    // Une réponse au commentaire : elle doit disparaître et réapparaître avec lui
    await request(app)
      .post(commentsUrl)
      .set(reporter.auth)
      .send({ content: 'Une réponse', parentId: commentId });

    await request(app)
      .post(`${api}/comments/${commentId}/reports`)
      .set(reporter.auth)
      .send({ reason: 'Propos insultants envers les membres' });
    const report = await prisma.report.findFirstOrThrow({ where: { commentId } });

    const resolved = await request(app)
      .post(`${api}/moderation/reports/${report.id}/resolve`)
      .set(moderator.auth)
      .send({ action: 'REJECT' });
    expect(resolved.status).toBe(200);

    // Masqué, pas supprimé
    const stored = await prisma.comment.findUniqueOrThrow({ where: { id: commentId } });
    expect(stored.removedAt).not.toBeNull();

    // L'action vise bien l'auteur du commentaire (avant : commentaire supprimé, auteur perdu)
    const action = await prisma.moderationAction.findFirstOrThrow({
      where: { actionType: 'RESOLVE_REPORT_REJECT' },
    });
    expect(action.userId).toBe(commenter.id);

    // Invisible partout : liste (réponse comprise), compteur, vote, signalement, édition, réponse
    const list = await request(app).get(commentsUrl).set(tipAuthor.auth);
    expect(list.body.data).toHaveLength(0);
    const detail = await request(app).get(`${api}/tips/${tip.id}`).set(tipAuthor.auth);
    expect(detail.body.data._count.comments).toBe(0);
    expect(detail.body.data.comments).toHaveLength(0);
    expect(
      (
        await request(app)
          .post(`${api}/comments/${commentId}/votes`)
          .set(tipAuthor.auth)
          .send({ value: 1 })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post(`${api}/comments/${commentId}/reports`)
          .set(tipAuthor.auth)
          .send({ reason: 'Encore ce commentaire insultant' })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch(`${api}/comments/${commentId}`)
          .set(commenter.auth)
          .send({ content: 'Je modifie en douce' })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post(commentsUrl)
          .set(tipAuthor.auth)
          .send({ content: 'Réponse impossible', parentId: commentId })
      ).status,
    ).toBe(400);

    // L'auteur conteste, l'admin accepte : le commentaire et sa réponse réapparaissent
    const appeal = await request(app)
      .post(`${api}/moderation-actions/${action.id}/appeal`)
      .set(commenter.auth)
      .send({ reason: 'Mon commentaire était une simple critique' });
    expect(appeal.status).toBe(201);
    const accepted = await request(app)
      .post(`${api}/admin/appeals/${appeal.body.data.id}/resolve`)
      .set(admin.auth)
      .send({ decision: 'ACCEPTED', response: 'Retrait injustifié' });
    expect(accepted.status).toBe(200);

    const restored = await request(app).get(commentsUrl).set(tipAuthor.auth);
    expect(restored.body.data).toHaveLength(1);
    expect(restored.body.data[0]).toMatchObject({ id: commentId, content: 'Commentaire signalé' });
    expect(restored.body.data[0].replies).toHaveLength(1);
  });
});
