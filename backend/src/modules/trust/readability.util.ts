// Analyse NLP basique de la qualité rédactionnelle d'un texte (0-100).
// Pas de dictionnaire : on repère les signes d'un texte bâclé (tout en majuscules,
// ponctuation ou lettres répétées, langage SMS, phrases sans majuscule ni ponctuation).

const SMS_WORDS = new Set([
  'slt',
  'stp',
  'svp',
  'pk',
  'pq',
  'bcp',
  'mdr',
  'ptdr',
  'jsp',
  'tkt',
  'koi',
  'kel',
  'kelle',
  'jpp',
  'osef',
  'dsl',
  'cc',
  'msg',
  'tt',
  'ki',
  'pr',
  'ds',
  'jte',
  'chui',
]);

const MIN_WORDS = 5;

export interface ReadabilityReport {
  score: number;
  penalties: Record<string, number>;
}

// null : texte trop court pour être jugé
export function analyzeReadability(text: string | null | undefined): ReadabilityReport | null {
  const content = (text ?? '').replace(/\s+/g, ' ').trim();
  const words = content.match(/[\p{L}\p{N}']+/gu) ?? [];
  if (words.length < MIN_WORDS) return null;

  const penalties: Record<string, number> = {};
  const add = (key: string, points: number) => {
    if (points > 0) penalties[key] = Math.round(points);
  };

  // Texte « crié » en majuscules
  const letters = content.match(/\p{L}/gu) ?? [];
  const upper = content.match(/\p{Lu}/gu) ?? [];
  if (letters.length >= 20 && upper.length / letters.length > 0.6) add('shouting', 40);

  // « !!!! », « ???? », « ...... »
  add('repeatedPunctuation', Math.min(15, (content.match(/([!?.])\1{3,}/g) ?? []).length * 5));

  // Lettres étirées : « suuuuper », « nooon »
  add('stretchedLetters', Math.min(15, (content.match(/(\p{L})\1{2,}/gu) ?? []).length * 5));

  // Langage SMS
  const smsCount = words.filter((word) => SMS_WORDS.has(word.toLowerCase())).length;
  add('smsLanguage', Math.min(25, smsCount * 5));

  // Phrases : majuscule initiale et longueur raisonnable
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => /\p{L}/u.test(sentence));
  const capitalized = sentences.filter((sentence) => /^[\p{Lu}\p{N}"«(]/u.test(sentence)).length;
  add('noCapitals', 15 * (1 - capitalized / Math.max(1, sentences.length)));

  const avgSentenceWords = words.length / Math.max(1, sentences.length);
  if (avgSentenceWords > 40) add('runOnSentences', 10);

  if (!/[.!?…)"»]$/.test(content)) add('noFinalPunctuation', 5);

  // Mots très courts en moyenne : abréviations, texte haché
  const avgWordLength = words.reduce((total, word) => total + word.length, 0) / words.length;
  if (avgWordLength < 3) add('shortWords', 10);

  const total = Object.values(penalties).reduce((sum, points) => sum + points, 0);
  return { score: Math.max(0, 100 - total), penalties };
}
