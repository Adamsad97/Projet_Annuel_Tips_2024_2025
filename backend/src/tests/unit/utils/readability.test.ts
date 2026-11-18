import { analyzeReadability } from '../../../modules/trust/readability.util';

describe('analyzeReadability', () => {
  it('ignore les textes trop courts pour etre juges', () => {
    expect(analyzeReadability('Super astuce')).toBeNull();
    expect(analyzeReadability(null)).toBeNull();
  });

  it('donne un score eleve a un texte soigne', () => {
    const report = analyzeReadability(
      'Pour détartrer une bouilloire, versez un verre de vinaigre blanc. ' +
        'Laissez agir une heure, puis rincez abondamment à l’eau claire.',
    );
    expect(report?.score).toBeGreaterThanOrEqual(90);
  });

  it('penalise le langage SMS, les cris et la ponctuation repetee', () => {
    const report = analyzeReadability('SLT TT LE MONDE CETTE ASTUCE EST TROP BIEN MDR !!!!!');
    expect(report?.score).toBeLessThan(50);
    expect(report?.penalties).toMatchObject({
      shouting: expect.any(Number),
      smsLanguage: expect.any(Number),
      repeatedPunctuation: expect.any(Number),
    });
  });

  it('penalise les phrases sans majuscule ni ponctuation finale', () => {
    const report = analyzeReadability('franchement c est suuuuper pratique je recommande a tous');
    expect(report?.penalties).toMatchObject({
      noCapitals: 15,
      noFinalPunctuation: 5,
      stretchedLetters: 5,
    });
  });
});
