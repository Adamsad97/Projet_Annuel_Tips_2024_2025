import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma, seedBadges } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import {
  GAMIFICATION_RULES,
  PERKS_BY_GRADE_RANK,
  STAFF_PERKS,
} from '../../modules/gamification/gamification.config';

describe('Gamification perks Integration', () => {
  const api = ROUTES.api;
  const baseUsers = api + ROUTES.users.base;
  const rank0 = PERKS_BY_GRADE_RANK[0]!;
  const rank1 = PERKS_BY_GRADE_RANK[1]!;

  const clearAll = async () => {
    await prisma.moderationAction.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.moderator.deleteMany();
    await prisma.admin.deleteMany();
    await clearTips();
    await clearUsers();
  };

  beforeAll(async () => {
    // Règles désactivées par défaut dans les tests (jest.setup) : on les active ici
    process.env.GAMIFICATION_ENFORCE = 'true';
    await seedBadges();
    await clearAll();
    // Grades maîtrisés : rang 0 dès 0 XP, rang 1 dès 50 XP, rang 2 dès 100 XP
    await prisma.grade.deleteMany();
    await prisma.grade.createMany({
      data: [
        { name: 'Débutant', xpRequired: 0 },
        { name: 'Novice', xpRequired: 50 },
        { name: 'Intermédiaire', xpRequired: 100 },
      ],
    });
  });

  afterEach(clearAll);

  afterAll(async () => {
    process.env.GAMIFICATION_ENFORCE = 'false';
    await disconnectPrisma();
  });

  const createUser = async (name: string, xp = 0, role?: 'MODERATOR' | 'ADMIN') => {
    const email = `${name}@test.com`;
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({ email, password: 'Password123!', username: name });
    const user = await prisma.user.update({ where: { email }, data: { xp } });
    if (role === 'MODERATOR') await prisma.moderator.create({ data: { userId: user.id } });
    if (role === 'ADMIN') await prisma.admin.create({ data: { userId: user.id } });
    const login = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email, password: 'Password123!' });
    const auth = { Authorization: `Bearer ${login.body.data.accessToken}` };
    return {
      id: user.id,
      auth,
      publish: (body: Record<string, unknown>) =>
        request(app)
          .post(api + ROUTES.tips.base)
          .set(auth)
          .send({ title: 'Une publication', content: 'Contenu de la publication', ...body }),
      perks: () => request(app).get(`${baseUsers}/me/perks`).set(auth),
    };
  };

  it('should describe the perks of a newcomer', async () => {
    const user = await createUser('newbie');

    const res = await user.perks();

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      xp: 0,
      grade: { name: 'Débutant', rank: 0 },
      perks: rank0,
      remainingToday: rank0.tipsPerDay,
      canPublishTip: false,
      minXpToPublishTip: GAMIFICATION_RULES.minXpToPublishTip,
      nextGrade: { name: 'Novice', xpMissing: 50, perks: rank1 },
    });
  });

  it('should let newcomers ask questions but require XP to publish tips', async () => {
    const newbie = await createUser('newbie');
    const regular = await createUser('regular', GAMIFICATION_RULES.minXpToPublishTip);

    const tip = await newbie.publish({ kind: 'TIP' });
    expect(tip.status).toBe(403);
    expect(tip.body.message).toContain(`${GAMIFICATION_RULES.minXpToPublishTip} XP`);

    const question = await newbie.publish({ kind: 'QUESTION', title: 'Comment faire ?' });
    expect(question.status).toBe(201);
    expect(question.body.data.kind).toBe('QUESTION');

    expect((await regular.publish({ kind: 'TIP' })).status).toBe(201);

    await prisma.tip.updateMany({ data: { status: 'APPROVED' } });
    const questions = await request(app).get(`${api}/tips?kind=QUESTION`).set(newbie.auth);
    expect(questions.body.data).toHaveLength(1);
    expect(questions.body.data[0].kind).toBe('QUESTION');
  });

  it('should enforce the daily publication limit of the grade', async () => {
    const user = await createUser('busy');

    for (let i = 0; i < rank0.tipsPerDay; i++) {
      expect((await user.publish({ kind: 'QUESTION', title: `Question ${i}` })).status).toBe(201);
    }

    const overLimit = await user.publish({ kind: 'QUESTION', title: 'Encore une question' });
    expect(overLimit.status).toBe(403);
    expect(overLimit.body.message).toContain('daily limit');
    expect((await user.perks()).body.data.remainingToday).toBe(0);
  });

  it('should unlock longer content, more images and location at higher grades', async () => {
    const beginner = await createUser('beginner', GAMIFICATION_RULES.minXpToPublishTip);
    const novice = await createUser('novice', 60);
    const twoImages = ['/uploads/tips/a.jpg', '/uploads/tips/b.jpg'];
    const location = { latitude: 48.85, longitude: 2.35 };

    const tooLong = await beginner.publish({ content: 'x'.repeat(rank0.maxContentLength + 1) });
    expect(tooLong.status).toBe(400);
    expect((await beginner.publish({ images: twoImages })).status).toBe(400);
    expect((await beginner.publish(location)).status).toBe(403);

    const unlocked = await novice.publish({
      content: 'x'.repeat(rank0.maxContentLength + 1),
      images: twoImages,
      ...location,
    });
    expect(unlocked.status).toBe(201);
  });

  it('should give moderators the top perks', async () => {
    const moderator = await createUser('modo', 0, 'MODERATOR');

    const res = await moderator.perks();

    expect(res.body.data).toMatchObject({ isStaff: true, perks: STAFF_PERKS, canPublishTip: true });
  });

  it('should unlock member downgrades for experienced moderators only', async () => {
    const rookie = await createUser('rookie', 0, 'MODERATOR');
    const veteran = await createUser(
      'veteran',
      GAMIFICATION_RULES.minModeratorXpToDowngrade,
      'MODERATOR',
    );
    const admin = await createUser('boss', 0, 'ADMIN');
    const member = await createUser('member', 120);
    const downgrade = (auth: Record<string, string>) =>
      request(app)
        .post(`${api}/moderation/users/${member.id}/downgrade`)
        .set(auth)
        .send({ reason: 'Contenus de mauvaise qualité' });

    const refused = await downgrade(rookie.auth);
    expect(refused.status).toBe(403);
    expect(refused.body.message).toContain(`${GAMIFICATION_RULES.minModeratorXpToDowngrade} XP`);

    expect((await downgrade(veteran.auth)).status).toBe(201);
    expect((await downgrade(admin.auth)).status).toBe(201);
  });
});
