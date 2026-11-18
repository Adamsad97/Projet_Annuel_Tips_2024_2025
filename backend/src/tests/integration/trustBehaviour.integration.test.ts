import request from 'supertest';
import app from '../../app';
import { prisma } from '../../db/prisma';
import { clearUsers, clearTips, disconnectPrisma } from '../prisma.helpers';
import { ROUTES } from '../../config/routes';
import { trustService } from '../../modules/trust/trust.service';
import { activityService } from '../../modules/trust/activity.service';
import { flushBackgroundTasks } from '../../utils/background.util';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const ago = (ms: number) => new Date(Date.now() - ms);

describe('Trust index behaviour factors Integration', () => {
  const baseUsers = ROUTES.api + ROUTES.users.base;

  const clearAll = async () => {
    await flushBackgroundTasks();
    await prisma.moderationAction.deleteMany();
    await prisma.moderator.deleteMany();
    await prisma.userSession.deleteMany();
    await clearTips();
    await clearUsers();
  };

  beforeAll(clearAll);
  afterEach(clearAll);
  afterAll(async () => {
    await flushBackgroundTasks();
    await disconnectPrisma();
  });

  const createUser = (name: string) =>
    prisma.user.create({
      data: { username: name, email: `${name}@test.com`, password: 'hashed:Password123!' },
    });

  const factor = async (userId: number, key: string) => {
    const breakdown = await trustService.computeBreakdown(userId);
    return breakdown.factors.find((f) => f.key === key);
  };

  it('should open a session on authenticated requests and extend it while active', async () => {
    activityService.setTrackingEnabled(true);
    await request(app)
      .post(baseUsers + ROUTES.users.register)
      .send({ email: 'active@test.com', password: 'Password123!', username: 'active' });
    const login = await request(app)
      .post(baseUsers + ROUTES.users.login)
      .send({ email: 'active@test.com', password: 'Password123!' });

    await request(app)
      .get(baseUsers + ROUTES.users.profile)
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    await flushBackgroundTasks();
    activityService.setTrackingEnabled(false);

    const userId = login.body.data.user.id as number;
    expect(await prisma.userSession.count({ where: { userId } })).toBe(1);

    // Activité 10 min plus tard : même session ; 2 h plus tard : nouvelle session
    const [session] = await prisma.userSession.findMany({ where: { userId } });
    await activityService.record(userId, new Date(session!.lastSeenAt.getTime() + 10 * 60000));
    expect(await prisma.userSession.count({ where: { userId } })).toBe(1);
    await activityService.record(userId, new Date(session!.lastSeenAt.getTime() + 2 * HOUR_MS));
    expect(await prisma.userSession.count({ where: { userId } })).toBe(2);
  });

  it('should reward regular activity and longer sessions', async () => {
    const regular = await createUser('regular');
    const occasional = await createUser('occasional');

    for (let day = 0; day < 10; day++) {
      const start = ago(day * DAY_MS + 2 * HOUR_MS);
      await prisma.userSession.create({
        data: {
          userId: regular.id,
          startedAt: start,
          lastSeenAt: new Date(start.getTime() + 20 * 60000),
        },
      });
    }
    await prisma.userSession.create({
      data: { userId: occasional.id, startedAt: ago(HOUR_MS), lastSeenAt: ago(HOUR_MS) },
    });

    const regularDays = await factor(regular.id, 'activeDays');
    const regularSession = await factor(regular.id, 'avgSessionMinutes');
    expect(regularDays?.value).toBe(10);
    expect(regularSession?.value).toBe(20);
    expect(regularDays!.points).toBeGreaterThan(
      (await factor(occasional.id, 'activeDays'))!.points,
    );
    expect((await factor(occasional.id, 'avgSessionMinutes'))?.points).toBe(0);
  });

  it('should score writing quality and stay neutral without long enough tips', async () => {
    const careful = await createUser('careful');
    const sloppy = await createUser('sloppy');
    const silent = await createUser('silent');

    await prisma.tip.create({
      data: {
        userId: careful.id,
        status: 'APPROVED',
        title: 'Détartrer une bouilloire',
        content: 'Versez un verre de vinaigre blanc. Laissez agir une heure, puis rincez bien.',
      },
    });
    await prisma.tip.create({
      data: {
        userId: sloppy.id,
        status: 'APPROVED',
        title: 'SLT TT LE MONDE',
        content: 'CETTE ASTUCE EST TROP BIEN MDR JSP PK PERSONNE LA CONNAIT !!!!!',
      },
    });

    expect((await factor(careful.id, 'writingQuality'))!.points).toBeGreaterThan(3);
    expect((await factor(sloppy.id, 'writingQuality'))!.points).toBeLessThan(0);
    expect((await factor(silent.id, 'writingQuality'))!.points).toBe(0);
  });

  it('should reward useful comments, quick answers and corrected tips', async () => {
    const author = await createUser('author');
    const reader = await createUser('reader');
    const tip = await prisma.tip.create({
      data: { userId: author.id, status: 'APPROVED', title: 'Astuce', content: 'Contenu.' },
    });

    // 3 commentaires reçus : l'auteur répond à 2 d'entre eux en moins de 24 h
    const asked = [ago(3 * DAY_MS), ago(2 * DAY_MS), ago(DAY_MS)];
    for (const createdAt of asked) {
      await prisma.comment.create({
        data: { userId: reader.id, tipId: tip.id, content: 'Une question ?', createdAt },
      });
    }
    for (const createdAt of asked.slice(0, 2)) {
      const answer = await prisma.comment.create({
        data: {
          userId: author.id,
          tipId: tip.id,
          content: 'Voici la réponse.',
          createdAt: new Date(createdAt.getTime() + HOUR_MS),
        },
      });
      await prisma.vote.create({ data: { userId: reader.id, commentId: answer.id, value: 1 } });
    }

    // Un tip refusé, corrigé puis validé ; un autre refusé et toujours refusé
    const corrected = await prisma.tip.create({
      data: { userId: author.id, status: 'APPROVED', title: 'Corrigé', content: 'Ok.' },
    });
    const abandoned = await prisma.tip.create({
      data: { userId: author.id, status: 'REJECTED', title: 'Abandonné', content: 'Ko.' },
    });
    for (const rejected of [corrected, abandoned]) {
      await prisma.moderationAction.create({
        data: { userId: author.id, actionType: 'REJECT_TIP', metadata: { tipId: rejected.id } },
      });
    }

    expect((await factor(author.id, 'responsiveness'))?.value).toBeCloseTo(66.7, 1);
    expect((await factor(author.id, 'usefulComments'))?.value).toBe(2);
    expect(await factor(author.id, 'feedbackAccepted')).toMatchObject({ value: 1, points: 2 });
    // Moins de 3 commentaires reçus : réactivité neutre
    expect((await factor(reader.id, 'responsiveness'))?.points).toBe(0);
  });

  it('should reward moderators who handle reports quickly', async () => {
    const fast = await createUser('fastmod');
    const slow = await createUser('slowmod');
    const member = await createUser('member');
    await prisma.moderator.createMany({ data: [{ userId: fast.id }, { userId: slow.id }] });

    const handle = (moderatorId: number, delayHours: number) =>
      prisma.moderationAction.create({
        data: {
          moderatorId,
          userId: member.id,
          actionType: 'RESOLVE_REPORT_REJECT',
          metadata: { reportedAt: ago(delayHours * HOUR_MS).toISOString() },
        },
      });
    for (let i = 0; i < 3; i++) {
      await handle(fast.id, 1);
      await handle(slow.id, 72);
    }

    const fastSpeed = await factor(fast.id, 'reportHandlingSpeed');
    const slowSpeed = await factor(slow.id, 'reportHandlingSpeed');
    expect(fastSpeed?.value).toBeCloseTo(1, 0);
    expect(fastSpeed!.points).toBeGreaterThan(slowSpeed!.points);
    expect((await factor(fast.id, 'reportsHandled'))?.value).toBe(3);
  });
});
