import {
  countMatches,
  keywordMatches,
  normalize,
  snippet,
  tokenize,
} from '../../../modules/chatbot/chatbot.text';

describe('chatbot text utils', () => {
  it('normalise la casse, les accents et la ponctuation', () => {
    expect(normalize('Tâche   de VIN, sur ma chemise !')).toBe('tache de vin sur ma chemise');
  });

  it('garde les mots utiles, sans mots vides ni doublons, au singulier', () => {
    expect(tokenize('Comment enlever des taches de vin sur mes chemises ?')).toEqual([
      'enlever',
      'tache',
      'vin',
      'chemise',
    ]);
  });

  it('compte les mots trouvés sans faux positif sur les mots courts', () => {
    expect(countMatches(['tache', 'vin'], 'Détacher une tâche de vin rouge')).toBe(2);
    expect(countMatches(['lessive'], 'Toutes les astuces pour les vêtements')).toBe(0);
    expect(countMatches(['reparation'], 'Comment réparer un pneu')).toBe(1);
  });

  it('déclenche une réponse type seulement si tous les mots du mot-clé sont présents', () => {
    expect(keywordMatches('mot de passe', tokenize("J'ai oublié mon mot de passe"))).toBe(true);
    expect(keywordMatches('mot de passe', tokenize('Un mot gentil'))).toBe(false);
  });

  it('extrait un passage centré sur le mot trouvé', () => {
    const content = `${'Introduction sans rapport. '.repeat(10)}Le vinaigre blanc enlève la tache.`;
    const extract = snippet(content, ['vinaigre']);
    expect(extract.startsWith('…')).toBe(true);
    expect(extract).toContain('vinaigre');
  });
});
