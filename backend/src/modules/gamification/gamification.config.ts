// Avantages débloqués selon le rang du grade (0 = grade le plus bas, trié par XP requise).
// Les grades étant modifiables par l'admin, on raisonne par rang : au-delà du dernier palier
// défini, c'est le dernier qui s'applique.
export interface GradePerks {
  tipsPerDay: number; // tips et questions publiés sur 24 h glissantes
  maxContentLength: number;
  maxImages: number;
  canAddLocation: boolean;
}

export const PERKS_BY_GRADE_RANK: GradePerks[] = [
  { tipsPerDay: 2, maxContentLength: 1500, maxImages: 1, canAddLocation: false },
  { tipsPerDay: 3, maxContentLength: 3000, maxImages: 3, canAddLocation: true },
  { tipsPerDay: 5, maxContentLength: 5000, maxImages: 5, canAddLocation: true },
  { tipsPerDay: 10, maxContentLength: 10000, maxImages: 5, canAddLocation: true },
];

// Modérateurs et admins : avantages du palier le plus haut
export const STAFF_PERKS = PERKS_BY_GRADE_RANK[PERKS_BY_GRADE_RANK.length - 1]!;

export const GAMIFICATION_RULES = {
  // Les questions sont ouvertes à tous ; proposer un tip demande un minimum d'XP
  minXpToPublishTip: 20,
  // Permission de modération débloquée par l'XP du modérateur (les admins en sont dispensés)
  minModeratorXpToDowngrade: 100,
};

// Règles actives par défaut ; GAMIFICATION_ENFORCE=false les désactive (utilisé par les tests
// qui ne portent pas sur la gamification). Lu à chaque appel pour pouvoir basculer en test.
export const isGamificationEnforced = (): boolean => process.env.GAMIFICATION_ENFORCE !== 'false';
