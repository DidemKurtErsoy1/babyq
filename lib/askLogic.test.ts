import { describe, it, expect } from 'vitest';
import {
  detectLangFromText,
  extractTempC,
  detectUrgent,
  evaluateRisk,
  emergencyNumber,
  needsDeepModel,
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

describe('needsDeepModel', () => {
  it('takes the FAST path for a short, single-topic question', () => {
    expect(needsDeepModel({ question: 'Bebeğim kabız, ne yapabilirim?', urgent: false })).toBe(false);
  });

  it('goes DEEP for urgent (red-flag-adjacent) questions', () => {
    expect(needsDeepModel({ question: 'nefes almakta zorlanıyor', urgent: true })).toBe(true);
  });

  it('goes DEEP for a long, detailed question', () => {
    const long = 'Bebeğim '.repeat(30); // > 160 chars
    expect(needsDeepModel({ question: long, urgent: false })).toBe(true);
  });

  it('goes DEEP for a stacked, multi-question prompt', () => {
    expect(needsDeepModel({ question: 'Ateşi var mı bilmiyorum? Ne yapmalıyım? Doktora gitmeli miyim?', urgent: false })).toBe(true);
  });

  it('goes DEEP when two distinct symptoms are mentioned', () => {
    expect(needsDeepModel({ question: 'hem ateşi hem de ishali var', urgent: false })).toBe(true);
  });

  it('does NOT double-count one symptom named in two languages', () => {
    // "fever" + "ateş" are the same concept → still the FAST path.
    expect(needsDeepModel({ question: 'has a fever, ateşi çıktı', urgent: false })).toBe(false);
  });

  it('does NOT treat "endişe" (worry) as a second symptom via the "diş" substring', () => {
    // Regression: a single-symptom, worried question must stay on the FAST path.
    expect(needsDeepModel({ question: '10 aylık bebekte hafif ateş var, endişelenmeli miyim?', urgent: false })).toBe(false);
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
