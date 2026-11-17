import { describe, it, expect } from 'vitest';
import {
  detectLangFromText,
  extractTempC,
  detectUrgent,
  evaluateRisk,
  emergencyNumber,
  faqRelevance,
  detectTopics,
  FAQ_SOURCE_MIN_SCORE,
} from './askLogic';

describe('detectLangFromText', () => {
  it('detects Turkish from diacritics', () => {
    expect(detectLangFromText('bebeğim öksürüyor ve ateşi var')).toBe('TR');
  });

  it('detects accent-free Turkish (the real-world bug: no diacritics)', () => {
    // A real user typed this and previously got an English answer.
    expect(detectLangFromText('bugun cok az yemek yedi')).toBe('TR');
  });

  it('detects Turkish from the -yor suffix alone', () => {
    expect(detectLangFromText('surekli agliyor ve uyumuyor')).toBe('TR');
  });

  it('detects Turkish from the mi/mı question particle', () => {
    expect(detectLangFromText('zeytinyagi kabizliga iyi gelir mi')).toBe('TR');
  });

  it('detects English', () => {
    expect(detectLangFromText('My baby has a mild fever, what should I do?')).toBe('EN');
  });

  it('defaults to English for empty input', () => {
    expect(detectLangFromText('')).toBe('EN');
  });
});

describe('extractTempC', () => {
  it('parses a decimal temperature', () => {
    expect(extractTempC('ateş 38.2 derece')).toBe(38.2);
  });

  it('parses a comma decimal', () => {
    expect(extractTempC('ateşi 39,5')).toBe(39.5);
  });

  it('parses "38 C" style', () => {
    expect(extractTempC('fever is 40 C')).toBe(40);
  });

  it('rejects out-of-range numbers (not a body temp)', () => {
    expect(extractTempC('7 aylık bebek')).toBeNull(); // age, not temperature
  });

  it('returns null when there is no number', () => {
    expect(extractTempC('bebeğim ateşlendi')).toBeNull();
  });
});

describe('detectUrgent', () => {
  it('flags a breathing red-flag word (EN)', () => {
    expect(detectUrgent(10, 'baby has trouble breathing')).toBe(true);
  });

  it('flags a seizure red-flag word (TR)', () => {
    expect(detectUrgent(10, 'bebek havale geçirdi')).toBe(true);
  });

  it('flags a young infant (<3mo) with fever', () => {
    expect(detectUrgent(2, '2 aylik bebekte 38 derece ates var')).toBe(true);
  });

  it('does NOT flag an older infant with a mild fever mention', () => {
    expect(detectUrgent(7, 'hafif huzursuz ama iyi')).toBe(false);
  });
});

describe('evaluateRisk', () => {
  it('is an emergency at 40°C for any age', () => {
    const r = evaluateRisk(24, 'ateş 40.1 derece');
    expect(r.emergency).toBe(true);
    expect(r.temp).toBe(40.1);
  });

  it('is an emergency for a <3mo infant at 38°C', () => {
    expect(evaluateRisk(2, '38 derece ates').emergency).toBe(true);
  });

  it('is NOT an emergency for a 7mo at 38.2°C without red flags', () => {
    const r = evaluateRisk(7, 'ateş 38.2 derece, keyfi yerinde');
    expect(r.emergency).toBe(false);
    expect(r.temp).toBe(38.2);
  });

  it('is an emergency on a red-flag sign regardless of temperature', () => {
    expect(evaluateRisk(12, 'dudakları morardı').emergency).toBe(true);
  });
});

describe('faqRelevance', () => {
  const sleepFaq   = { category: 'sleep', question: '6–12 aylık bebek gece sık uyanıyor, normal mi?', answer: 'Bu yaşta gece uyanmaları sıktır.' };
  const feverFaq   = { category: 'fever', question: 'Bebekte 38.2°C ateş olursa ne yapmalı?', answer: 'Sakin kalın ve ince giydirin.' };
  const respFaq    = { category: 'respiratory', question: 'Öksürük ve burun akıntısı ne zaman doktora götürülmeli?', answer: 'Üç günden uzun süren öksürük.' };

  it('scores a topically matching FAQ above the citation threshold', () => {
    expect(faqRelevance('bebeğim gece sürekli uyanıyor', sleepFaq)).toBeGreaterThanOrEqual(FAQ_SOURCE_MIN_SCORE);
  });

  it('matches Turkish topics even when inflected/accent-free', () => {
    // "uyuyabilecegim" must still hit the sleep topic via the "uyu" stem.
    expect(faqRelevance('ben ne zaman uyuyabilecegim', sleepFaq)).toBeGreaterThanOrEqual(FAQ_SOURCE_MIN_SCORE);
  });

  it('keeps an unrelated FAQ below the threshold (the real bug)', () => {
    // "who won the world cup" used to surface a fever FAQ as its "source".
    expect(faqRelevance('who won the world cup', feverFaq)).toBeLessThan(FAQ_SOURCE_MIN_SCORE);
    expect(faqRelevance('who won the world cup', respFaq)).toBeLessThan(FAQ_SOURCE_MIN_SCORE);
  });

  it('does not let a sleep question cite a respiratory FAQ', () => {
    expect(faqRelevance('bebeğim gece uyumuyor', respFaq)).toBeLessThan(FAQ_SOURCE_MIN_SCORE);
  });

  it('is not fooled by stopwords alone', () => {
    // Single letters / common words must not accumulate a citable score.
    expect(faqRelevance('i can do this', feverFaq)).toBeLessThan(FAQ_SOURCE_MIN_SCORE);
  });
});

describe('detectTopics', () => {
  it('finds the topic in an English question', () => {
    expect(detectTopics('my baby has a fever')).toContain('fever');
  });

  it('finds no topic in an off-scope question', () => {
    expect(detectTopics('who won the world cup')).toHaveLength(0);
  });
});

describe('emergencyNumber', () => {
  it('maps known countries', () => {
    expect(emergencyNumber('US')).toBe('911');
    expect(emergencyNumber('gb')).toBe('999');
    expect(emergencyNumber('AU')).toBe('000');
  });

  it('defaults to 112 for Turkey and unknown/missing', () => {
    expect(emergencyNumber('TR')).toBe('112');
    expect(emergencyNumber(null)).toBe('112');
    expect(emergencyNumber('ZZ')).toBe('112');
  });
});

// Regressions found by the emergency eval (evals/emergency).
describe('extractTempC — eval regressions', () => {
  it('reads the temperature even when the age comes first (was: read 14, missed 40.3)', () => {
    expect(extractTempC('14 aylık oğlumun ateşi 40.3 oldu')).toBe(40.3);
  });
  it('ignores numbers followed by age/time/weight units', () => {
    expect(extractTempC('2 aylık oğlum 38 dakika ağladı')).toBeNull();
    expect(extractTempC('14 aylık 38 kilo')).toBeNull();
    expect(extractTempC('6 week old sleeps 3 hours')).toBeNull();
  });
  it('converts Fahrenheit', () => {
    expect(extractTempC('fever of 101 F')).toBe(38.3);
    expect(extractTempC('reading 104.5°F')).toBe(40.3);
  });
  it('takes the highest of several readings', () => {
    expect(extractTempC("ateşi 38'den 40,5'e çıktı")).toBe(40.5);
  });
});

describe('evaluateRisk — eval regressions', () => {
  const urgent = (age: number, q: string) => evaluateRisk(age, q).emergency;

  it('catches 40°C+ and Fahrenheit fevers', () => {
    expect(urgent(14, '14 aylık oğlumun ateşi 40.3 oldu düşmüyor')).toBe(true);
    expect(urgent(1, 'my 3 week old is 100.6 F')).toBe(true);
    expect(urgent(0, '3 haftalık bebeğim 38,1')).toBe(true);
  });

  it('still catches red flags phrased many ways', () => {
    for (const q of [
      'nefes alırken çok zorlanıyor', 'zor nefes alıyor', 'nefes darlığı var', 'nefesi duruyor gibi',
      'baby is breathing really fast and hard', 'having difficulty with breathing',
      'yüzü mavi oldu', 'his face went blue', 'ateşli nöbet geçirdi', 'sara nöbeti geçirdi',
      'hırıltılı nefes alıyor', 'tepkisiz yatıyor',
    ]) expect(urgent(6, q), q).toBe(true);
  });

  it('does not raise false alarms on ordinary questions', () => {
    for (const q of [
      'uykuya dalmakta zorlanıyor', 'gözleri mavi mi kalacak', 'nefesi kötü kokuyor', 'my baby has bad breath',
      'I think I have the baby blues', 'nöbetçi eczane nerede', 'gece nöbetini eşimle paylaşıyoruz',
      'bilinçli ebeveynlik nedir', 'his eyes are blue', 'emzirmekte zorlanıyorum',
    ]) expect(urgent(6, q), q).toBe(false);
    expect(urgent(2, '2 aylık oğlum 38 dakika ağladı')).toBe(false);
  });
});
