import { prisma } from '../../db/prisma';
import { xpService } from '../../modules/xp/xp.service';
import { XpAction } from '../../types/xp.types';
import { clearUsers, disconnectPrisma, seedBadges } from '../prisma.helpers';

describe('XP Service Integration', () => {
  beforeAll(async () => {
    await seedBadges();
  });

  beforeEach(async () => {
    await clearUsers();
    await prisma.grade.deleteMany();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  const createUser = async (xp = 0) => {
    return prisma.user.create({
      data: {
        email: `user${Date.now()}@test.com`,
        password: 'hashed:password',
        username: `user${Date.now()}`,
        firstname: 'Test',
        lastname: 'User',
        xp,
      },
    });
  };

  const seedGrades = async () => {
    await prisma.grade.createMany({
      data: [
        { name: 'Débutant', xpRequired: 0 },
        { name: 'Novice', xpRequired: 50 },
        { name: 'Intermédiaire', xpRequired: 100 },
        { name: 'Avancé', xpRequired: 200 },
        { name: 'Expert', xpRequired: 500 },
      ],
    });
  };

  describe('addXp', () => {
    it('ajoute xp et retourne event', async () => {
      const user = await createUser(0);

      const result = await xpService.addXp(user.id, XpAction.TIP_APPROVED, 10);

      expect(result).toMatchObject({
        userId: user.id,
        action: XpAction.TIP_APPROVED,
        amount: 10,
        newTotal: 10,
      });

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.xp).toBe(10);
    });

    it('erreur si xp est zero', async () => {
      const user = await createUser(0);

      await expect(xpService.addXp(user.id, XpAction.TIP_APPROVED, 0)).rejects.toMatchObject({
        statusCode: 400,
        message: 'xp amount cannot be zero',
      });
    });
  });

  describe('checkGradePromotion', () => {
    it('promeut au grade suivant si seuil atteint', async () => {
      await seedGrades();
      const user = await createUser(60);

      const debutantGrade = await prisma.grade.findUnique({ where: { name: 'Débutant' } });
      const noviceGrade = await prisma.grade.findUnique({ where: { name: 'Novice' } });

      await prisma.user.update({
        where: { id: user.id },
        data: { gradeId: debutantGrade!.id },
      });

      const result = await xpService.checkGradePromotion(user.id);

      expect(result).toBeDefined();
      expect(result?.newGrade).toBe('Novice');
      expect(result?.oldGrade).toBe('Débutant');
      expect(result?.newGradeId).toBe(noviceGrade!.id);

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.gradeId).toBe(noviceGrade!.id);
    });

    it('retourne null si seuil pas atteint', async () => {
      await seedGrades();
      const user = await createUser(30);

      const debutantGrade = await prisma.grade.findUnique({ where: { name: 'Débutant' } });
      await prisma.user.update({
        where: { id: user.id },
        data: { gradeId: debutantGrade!.id },
      });

      const result = await xpService.checkGradePromotion(user.id);

      expect(result).toBeNull();
    });
  });

  describe('getUserProgress', () => {
    it('retourne les donnees de progression complete', async () => {
      await seedGrades();
      const user = await createUser(75);

      const noviceGrade = await prisma.grade.findUnique({ where: { name: 'Novice' } });
      await prisma.user.update({
        where: { id: user.id },
        data: { gradeId: noviceGrade!.id },
      });

      await prisma.tip.create({
        data: {
          title: 'Test Tip',
          content: 'Content',
          userId: user.id,
          status: 'APPROVED',
        },
      });

      const result = await xpService.getUserProgress(user.id);

      expect(result.currentXp).toBe(75);
      expect(result.currentGrade?.name).toBe('Novice');
      expect(result.nextGrade?.name).toBe('Intermédiaire');
      expect(result.xpToNextGrade).toBe(25);
      expect(result.progressPercent).toBeGreaterThan(0);
      expect(result.stats.tipsCreated).toBe(1);
    });

    it('erreur si utilisateur inexistant', async () => {
      await expect(xpService.getUserProgress(99999)).rejects.toMatchObject({
        statusCode: 404,
        message: 'User not found',
      });
    });
  });

  describe('getLeaderboard', () => {
    it('retourne utilisateurs tries par xp decroissant', async () => {
      const user1 = await createUser(100);
      const user2 = await createUser(250);
      const user3 = await createUser(50);

      const result = await xpService.getLeaderboard(10, 0);

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      expect(result[0].xp).toBe(250);
      expect(result[0].user.id).toBe(user2.id);

      expect(result[1].rank).toBe(2);
      expect(result[1].xp).toBe(100);

      expect(result[2].rank).toBe(3);
      expect(result[2].xp).toBe(50);
    });

    it('supporte la pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await createUser(i * 10);
      }

      const result = await xpService.getLeaderboard(2, 2);

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(3);
      expect(result[1].rank).toBe(4);
    });
  });

  describe('Full XP Flow Integration', () => {
    it('ajoute xp et promeut automatiquement a travers les grades', async () => {
      await seedGrades();
      const user = await createUser(0);

      const debutantGrade = await prisma.grade.findUnique({ where: { name: 'Débutant' } });
      await prisma.user.update({
        where: { id: user.id },
        data: { gradeId: debutantGrade!.id },
      });

      // 60 xp -> promeut a novice
      await xpService.addXp(user.id, XpAction.TIP_APPROVED, 60);

      let updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { grade: true },
      });
      expect(updatedUser?.xp).toBe(60);
      expect(updatedUser?.grade?.name).toBe('Novice');

      // 50 xp de plus (total 110) -> promeut a intermediaire
      await xpService.addXp(user.id, XpAction.TIP_APPROVED, 50);

      updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { grade: true },
      });
      expect(updatedUser?.xp).toBe(110);
      expect(updatedUser?.grade?.name).toBe('Intermédiaire');
    });
  });
});
