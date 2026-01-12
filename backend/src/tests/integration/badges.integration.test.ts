import { prisma } from '../../db/prisma';
import { badgeService } from '../../modules/badges/badge.service';
import { BadgeCode } from '../../types/badge.types';
import { clearUsers, disconnectPrisma, seedBadges } from '../prisma.helpers';

describe('Badge Service Integration', () => {
  beforeAll(async () => {
    await seedBadges();
  });

  beforeEach(async () => {
    await clearUsers();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  const createUser = async () => {
    return prisma.user.create({
      data: {
        email: `user${Date.now()}${Math.random()}@test.com`,
        password: 'hashed:password',
        username: `user${Date.now()}${Math.random()}`,
        firstname: 'Test',
        lastname: 'User',
      },
    });
  };

  const createTipsForUser = async (userId: number, count: number) => {
    const tips = [];
    for (let i = 0; i < count; i++) {
      const tip = await prisma.tip.create({
        data: {
          title: `Tip ${i}`,
          content: `Content ${i}`,
          userId,
          status: 'APPROVED',
        },
      });
      tips.push(tip);
    }
    return tips;
  };

  const createUpvotesForTips = async (tipIds: number[], voterId: number) => {
    for (const tipId of tipIds) {
      await prisma.vote.create({
        data: {
          tipId,
          userId: voterId,
          value: 1,
        },
      });
    }
  };

  const createCommentsForUser = async (userId: number, tipId: number, count: number) => {
    for (let i = 0; i < count; i++) {
      await prisma.comment.create({
        data: {
          content: `Comment ${i}`,
          userId,
          tipId,
        },
      });
    }
  };

  describe('checkAndAwardBadges - FIRST_TIP', () => {
    it('attribue badge premier tip apres creation', async () => {
      const user = await createUser();
      await createTipsForUser(user.id, 1);

      const userXpBefore = (await prisma.user.findUnique({ where: { id: user.id } }))?.xp || 0;

      const awardedBadges = await badgeService.checkAndAwardBadges(user.id);

      expect(awardedBadges).toContain(BadgeCode.FIRST_TIP);

      const userBadge = await prisma.userBadge.findFirst({
        where: { userId: user.id },
        include: { badge: true },
      });
      expect(userBadge).toBeDefined();
      expect(userBadge?.badge.code).toBe(BadgeCode.FIRST_TIP);

      const userXpAfter = (await prisma.user.findUnique({ where: { id: user.id } }))?.xp || 0;
      expect(userXpAfter).toBeGreaterThan(userXpBefore);
    });

    it('ne reattribue pas le badge', async () => {
      const user = await createUser();
      await createTipsForUser(user.id, 1);
      await badgeService.checkAndAwardBadges(user.id);

      const awardedBadges = await badgeService.checkAndAwardBadges(user.id);

      expect(awardedBadges).toHaveLength(0);

      const badges = await prisma.userBadge.findMany({
        where: { userId: user.id },
      });
      expect(badges).toHaveLength(1);
    });
  });

  describe('checkAndAwardBadges - HELPFUL', () => {
    it('attribue badge helpful apres 100 upvotes', async () => {
      const user = await createUser();
      const voter = await createUser();

      const tips = await createTipsForUser(user.id, 100);
      const tipIds = tips.map((t) => t.id);
      await createUpvotesForTips(tipIds, voter.id);

      const awardedBadges = await badgeService.checkAndAwardBadges(user.id);

      expect(awardedBadges).toContain(BadgeCode.HELPFUL);

      const userBadge = await prisma.userBadge.findFirst({
        where: {
          userId: user.id,
          badge: { code: BadgeCode.HELPFUL },
        },
        include: { badge: true },
      });
      expect(userBadge).toBeDefined();
    });

    it('pas de badge helpful avec seulement 50 upvotes', async () => {
      const user = await createUser();
      const voter = await createUser();

      const tips = await createTipsForUser(user.id, 50);
      const tipIds = tips.map((t) => t.id);
      await createUpvotesForTips(tipIds, voter.id);

      const awardedBadges = await badgeService.checkAndAwardBadges(user.id);

      expect(awardedBadges).not.toContain(BadgeCode.HELPFUL);

      const userBadge = await prisma.userBadge.findFirst({
        where: {
          userId: user.id,
          badge: { code: BadgeCode.HELPFUL },
        },
      });
      expect(userBadge).toBeNull();
    });
  });

  describe('checkAndAwardBadges - COMMENTATOR', () => {
    it('attribue badge commentateur apres 50 commentaires', async () => {
      const user = await createUser();
      const tipOwner = await createUser();
      const tip = await prisma.tip.create({
        data: {
          title: 'Test Tip',
          content: 'Content',
          userId: tipOwner.id,
          status: 'APPROVED',
        },
      });

      await createCommentsForUser(user.id, tip.id, 50);

      const awardedBadges = await badgeService.checkAndAwardBadges(user.id);

      expect(awardedBadges).toContain(BadgeCode.COMMENTATOR);
    });
  });

  describe('getUserBadges', () => {
    it('retourne tous les badges gagnes', async () => {
      const user = await createUser();
      await createTipsForUser(user.id, 1);
      await badgeService.checkAndAwardBadges(user.id);

      const badges = await badgeService.getUserBadges(user.id);

      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0]).toHaveProperty('code');
      expect(badges[0]).toHaveProperty('earnedAt');
    });

    it('retourne tableau vide sans badges', async () => {
      const user = await createUser();

      const badges = await badgeService.getUserBadges(user.id);

      expect(badges).toHaveLength(0);
    });
  });

  describe('getAllBadgesWithStatus', () => {
    it('retourne tous les badges avec statut gagne', async () => {
      const user = await createUser();
      await createTipsForUser(user.id, 1);
      await badgeService.checkAndAwardBadges(user.id);

      const badges = await badgeService.getAllBadgesWithStatus(user.id);

      expect(badges.length).toBeGreaterThan(0);

      const firstTipBadge = badges.find((b) => b.code === BadgeCode.FIRST_TIP);
      expect(firstTipBadge?.earned).toBe(true);
      expect(firstTipBadge?.earnedAt).toBeDefined();

      const otherBadges = badges.filter((b) => b.code !== BadgeCode.FIRST_TIP);
      expect(otherBadges.every((b) => !b.earned)).toBe(true);
    });
  });

  describe('Full Badge Flow Integration', () => {
    it('attribue plusieurs badges au fur et a mesure', async () => {
      const user = await createUser();
      const voter = await createUser();

      // 1 tip -> first_tip
      await createTipsForUser(user.id, 1);
      let awarded = await badgeService.checkAndAwardBadges(user.id);

      expect(awarded).toContain(BadgeCode.FIRST_TIP);

      // 49 tips de plus (total 50) -> tip_master
      await createTipsForUser(user.id, 49);
      awarded = await badgeService.checkAndAwardBadges(user.id);

      expect(awarded).toContain(BadgeCode.TIP_MASTER);

      const userBadges = await badgeService.getUserBadges(user.id);
      expect(userBadges.length).toBeGreaterThanOrEqual(2);
      expect(userBadges.some((b) => b.code === BadgeCode.FIRST_TIP)).toBe(true);
      expect(userBadges.some((b) => b.code === BadgeCode.TIP_MASTER)).toBe(true);
    });
  });

  describe('Badge Progress Calculation', () => {
    it('affiche la progression correcte vers les badges', async () => {
      // 25 tips = 50% vers tip_master qui necessite 50
      const user = await createUser();
      await createTipsForUser(user.id, 25);

      await badgeService.checkAndAwardBadges(user.id);

      const badges = await badgeService.getAllBadgesWithStatus(user.id);

      const tipMasterBadge = badges.find((b) => b.code === BadgeCode.TIP_MASTER);
      expect(tipMasterBadge?.progress).toBe(50);
      expect(tipMasterBadge?.earned).toBe(false);
    });
  });
});
