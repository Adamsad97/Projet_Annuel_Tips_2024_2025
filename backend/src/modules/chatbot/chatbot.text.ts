// Outils de texte du chatbot : recherche insensible à la casse, aux accents et au pluriel

// Mots trop courants pour aider à trouver un tip
const STOPWORDS = new Set(
  (
    'a au aux avec ce ces comment dans de des du elle en et est etre eux faire fait il ils je la le les leur lui ' +
    'ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que quel quelle qui sa se ses son ' +
    'sur ta te tes toi ton tu un une vos votre vous y peut peux veux voudrais besoin aide aider svp merci ' +
    'bonjour salut quoi plus tres bien mieux avoir ai as cest jai mon ma faut dois doit trouver'
  ).split(' '),
);

const MIN_TOKEN_LENGTH = 3;

export const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Pluriels simples : "astuces" -> "astuce", "chevaux" -> "cheval" n'est pas géré (volontairement simple)
const singular = (word: string): string =>
  word.length > 4 && (word.endsWith('s') || word.endsWith('x')) ? word.slice(0, -1) : word;

// Mots significatifs d'une question, sans doublon
export const tokenize = (text: string): string[] => [
  ...new Set(
    normalize(text)
      .split(/[\s-]+/)
      .filter((word) => word.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(word))
      .map(singular),
  ),
];

// Racine commune minimale : "reparation" et "reparer" partagent "repar", mais "les" ne doit pas
// correspondre à "lessive". Heuristique volontairement simple (pas de vrai stemming).
const MIN_STEM_LENGTH = 5;
const MIN_STEM_RATIO = 0.6;

const commonPrefixLength = (a: string, b: string): number => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

const wordMatchesToken = (word: string, token: string): boolean => {
  if (word === token || word.startsWith(token)) return true;
  const shared = commonPrefixLength(word, token);
  return (
    shared >= MIN_STEM_LENGTH && shared >= Math.min(word.length, token.length) * MIN_STEM_RATIO
  );
};

// Nombre de mots de la question présents dans un texte (insensible aux accents et au pluriel)
export const countMatches = (tokens: string[], text: string): number => {
  const words = tokenize(text);
  return tokens.filter((token) => words.some((word) => wordMatchesToken(word, token))).length;
};

// Extrait du contenu centré sur le premier mot trouvé
export const snippet = (content: string, tokens: string[], length = 180): string => {
  const normalized = normalize(content);
  const index = tokens
    .map((token) => normalized.indexOf(token))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b)[0];

  // normalize() conserve la longueur à peu près ; on se cale sur le texte d'origine
  const start = Math.max(0, (index ?? 0) - 40);
  const extract = content.slice(start, start + length).trim();
  return `${start > 0 ? '…' : ''}${extract}${start + length < content.length ? '…' : ''}`;
};

// Une réponse type se déclenche si tous les mots d'un de ses mots-clés sont dans la question
export const keywordMatches = (keyword: string, questionTokens: string[]): boolean => {
  const keywordTokens = tokenize(keyword);
  return (
    keywordTokens.length > 0 &&
    keywordTokens.every((token) => questionTokens.some((word) => wordMatchesToken(word, token)))
  );
};
