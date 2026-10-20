-- Données de référence nécessaires au fonctionnement (grades, badges, catégories, chatbot).
-- Appliquées une seule fois par `prisma migrate deploy`, y compris en production où le seed
-- (comptes et tips de démonstration) n'est pas lancé. ON CONFLICT : une base déjà remplie
-- par le seed n'est pas modifiée, et les changements faits ensuite par l'admin sont conservés.

INSERT INTO "Grade" ("name", "xpRequired") VALUES
  ('Débutant', 0),
  ('Apprenti', 50),
  ('Confirmé', 150),
  ('Expert', 500),
  ('Maître', 1000),
  ('Légende', 5000)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Badge" ("code", "name", "description", "icon", "xpReward") VALUES
  ('FIRST_TIP', 'Premier pas', 'Créer ton premier tip', '🎉', 5),
  ('TIP_MASTER', 'Expert', 'Créer 50 tips', '🏆', 50),
  ('TIP_LEGEND', 'Légende', 'Créer 200 tips', '👑', 200),
  ('HELPFUL', 'Serviable', 'Recevoir 100 upvotes', '❤️', 30),
  ('SUPER_HELPFUL', 'Super Serviable', 'Recevoir 500 upvotes', '💎', 100),
  ('SOCIAL', 'Social', 'Avoir 10 followers', '⭐', 20),
  ('INFLUENCER', 'Influenceur', 'Avoir 100 followers', '🌟', 100),
  ('COMMENTATOR', 'Commentateur', 'Écrire 50 commentaires', '💬', 30),
  ('EARLY_BIRD', 'Early Bird', 'Membre des 30 premiers jours', '🐦', 50)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Category" ("name", "description") VALUES
  ('Technologie', 'Tips tech et informatique'),
  ('Cuisine', 'Recettes et astuces culinaires'),
  ('Santé', 'Bien-être et santé'),
  ('Éducation', 'Apprentissage et formation'),
  ('Finance', 'Argent et investissement')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "ChatbotConfig" ("id", "greeting", "fallbackMessage", "contextNote", "updatedAt") VALUES (
  1,
  'Bonjour ! Décrivez votre problème en quelques mots et je vous propose les tips les plus utiles.',
  'Je n''ai pas trouvé de tip qui corresponde vraiment. Posez la question à la communauté : les membres vous répondront.',
  'Pensez à voter « utile » sur les tips qui vous ont aidé !',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Réponses types : seulement si l'admin n'en a encore aucune
INSERT INTO "ChatbotResponse" ("keywords", "answer", "link", "priority", "updatedAt")
SELECT r.keywords, r.answer, r.link, r.priority, CURRENT_TIMESTAMP
FROM (VALUES
  (ARRAY['mot de passe', 'password'],
   'Vous pouvez changer votre mot de passe dans Paramètres > Sécurité. Pensez aussi à activer la double authentification.',
   '/settings', 10),
  (ARRAY['signaler', 'contenu inapproprie', 'spam'],
   'Utilisez le bouton « Signaler » sous un tip ou un commentaire : un modérateur examinera le contenu.',
   NULL, 5),
  (ARRAY['gagner xp', 'grade', 'badge'],
   'Vous gagnez de l''XP en publiant, en commentant et en recevant des votes « utile ». Votre profil détaille vos avantages et le grade suivant.',
   '/profile', 5)
) AS r(keywords, answer, link, priority)
WHERE NOT EXISTS (SELECT 1 FROM "ChatbotResponse");
