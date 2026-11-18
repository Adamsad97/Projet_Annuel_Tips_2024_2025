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
  activeDays: { max: 4, half: 8, periodDays: 30 }, // régularité : jours actifs sur la période
  avgSessionMinutes: { max: 3, half: 10, periodDays: 30 },
  usefulComments: { max: 4, half: 5 }, // commentaires au score de votes positif

  // Qualité du contenu
  voteRatio: { max: 10, minVotes: 5 }, // de -max à +max selon le ratio utile / pas utile
  removedContent: { perItem: 10, cap: 30 }, // contenus retirés après un signalement validé
  rejectedTips: { perItem: 2, cap: 10 }, // tips refusés à la validation
  falseReports: { max: 10, half: 5 }, // signalements faits par l'utilisateur et rejetés
  rejectedAppeals: { perItem: 4, cap: 12 }, // contestations injustifiées
  // Qualité rédactionnelle moyenne des tips publiés (0-100) : de -max à +max autour de 50
  writingQuality: { max: 5, sampleSize: 20 },

  // Sanctions non annulées
  sanctions: { WARN: 5, DOWNGRADE: 10, MUTE: 10, BAN: 25, cap: 40 } as Record<string, number>,

  // Interaction communautaire
  commentsReceived: { max: 5, half: 20 },
  // Part des commentaires reçus auxquels l'auteur a répondu sous 24 h
  responsiveness: { max: 5, withinHours: 24, minComments: 3, periodDays: 90 },
  // Tips refusés, corrigés par l'auteur puis validés
  feedbackAccepted: { perItem: 2, cap: 6 },

  // Spécifique aux modérateurs
  moderationActivity: { max: 10, half: 30, periodDays: 90 },
  moderationErrors: { max: 20 }, // proportion d'actions annulées par un admin
  moderatorInactivity: { penalty: 5, periodDays: 30 },
  reportsHandled: { max: 5, half: 15, periodDays: 90 }, // signalements traités, non annulés
  // Délai moyen de traitement : max à 0 h, moitié des points à `halfHours`
  reportHandlingSpeed: { max: 5, halfHours: 24, minReports: 3, periodDays: 90 },
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
