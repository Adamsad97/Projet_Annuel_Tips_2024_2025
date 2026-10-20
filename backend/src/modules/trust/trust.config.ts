// Pondération de l'indice de confiance (0-100). Chaque facteur rapporte au plus `max` points
// (ou en retire au plus `max` pour les facteurs négatifs) ; `half` est la valeur à laquelle la
// moitié des points est atteinte, pour que les gros volumes ne fassent pas exploser le score.
export const TRUST_BASE = 50;

export const TRUST_WEIGHTS = {
  // Activité positive
  publishedTips: { max: 15, half: 10 },
  avgUpvotesPerTip: { max: 10, half: 5 },
  commentsWritten: { max: 5, half: 20 },
  seniorityDays: { max: 5, half: 180 },
  recentLogin: { points: 3, withinDays: 14 },
  categoryDiversity: { max: 5, half: 4 },

  // Qualité du contenu
  voteRatio: { max: 10, minVotes: 5 }, // de -max à +max selon le ratio utile / pas utile
  removedContent: { perItem: 10, cap: 30 }, // contenus retirés après un signalement validé
  rejectedTips: { perItem: 2, cap: 10 }, // tips refusés à la validation
  falseReports: { max: 10, half: 5 }, // signalements faits par l'utilisateur et rejetés
  rejectedAppeals: { perItem: 4, cap: 12 }, // contestations injustifiées

  // Sanctions non annulées
  sanctions: { WARN: 5, DOWNGRADE: 10, MUTE: 10, BAN: 25, cap: 40 } as Record<string, number>,

  // Interaction communautaire
  commentsReceived: { max: 5, half: 20 },

  // Spécifique aux modérateurs
  moderationActivity: { max: 10, half: 30, periodDays: 90 },
  moderationErrors: { max: 20 }, // proportion d'actions annulées par un admin
  moderatorInactivity: { penalty: 5, periodDays: 30 },
};

export const TRUST_RULES = {
  // Anti-troll : pas de montée en grade sous ce seuil
  minTrustForGradePromotion: 35,

  // Promotion automatique membre -> modérateur
  autoPromotion: {
    enabled: true,
    minTrust: 80,
    minXp: 500,
    minAccountAgeDays: 30,
    minPublishedTips: 10,
  },

  // Modérateurs : rétrogradation automatique sous `autoDemoteBelow`,
  // signalés à l'admin (rétrogradation assistée) sous `watchBelow` ou s'ils sont inactifs
  moderators: {
    autoDemoteBelow: 30,
    watchBelow: 45,
  },

  // Recalcul en arrière-plan
  recomputeIntervalMinutes: 60,
};

// Actions qui pénalisent l'utilisateur ciblé tant qu'elles ne sont pas annulées
export const SANCTION_ACTIONS = ['WARN', 'DOWNGRADE', 'MUTE', 'BAN'];
