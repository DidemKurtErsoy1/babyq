// lib/askLogic.ts
//
// Pure decision logic for the Ask endpoint, extracted so it can be unit
// tested in isolation (no Request, no network). These are the safety-
// critical functions — language detection, temperature parsing, and
// emergency/urgency evaluation — so they get direct test coverage.

export type Lang = 'TR' | 'EN';

/**
 * Detect Turkish vs English from free text alone (no ?lang override — the
 * route applies that separately). Designed to survive accent-free typing,
 * which is very common in informal Turkish input (e.g. "agliyor", "iyi mi").
 */
export function detectLangFromText(text: string): Lang {
  const s = (text || '').toLowerCase();

  // Turkish diacritics are the strongest signal, when present.
  if (/[çğışöü]/.test(s)) return 'TR';

  // Turkish present-continuous (-yor) and question-particle (mi/mı/mu/mü)
  // suffixes are distinctive and survive even when diacritics are dropped.
  if (/\w*(yor|iyor|uyor)\b/.test(s)) return 'TR';
  if (/\b(mi|mı|mu|mü)\b/.test(s)) return 'TR';

  // Common Turkish words, ASCII-folded so they still match without diacritics.
  const trWords = [
    'bugun','dun','yarin','simdi','cok','az','gibi','kadar','sonra','once',
    'neden','niye','nasil','kac','degil','var','yok','oldu','olur','yapti',
    'yedi','icti','uyudu','uyumadi','agladi','hasta','doktor','bebek',
    'bebegim','cocugum','kizim','oglum','endiseliyim','yardim','lutfen',
    'tesekkur','merhaba','selam','ay','ates','oksur','ishal','kus',
    'bir','bu','su','ve','veya','ile','icin','ama','fakat',
  ];
  if (trWords.some((w) => new RegExp(`\\b${w}\\b`).test(s))) return 'TR';

  return 'EN';
}

/** Parse a plausible body temperature (°C) from free text, or null. */
export function extractTempC(q: string): number | null {
  const s = (q || '').toLowerCase();
  const m = s.match(/(\d{2}(?:[.,]\d)?)(?:\s?°\s?c| ?c| ?derece)?/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  if (isNaN(n) || n < 30 || n > 45) return null;
  return n;
}

/** True when the text contains a red-flag sign, or a young infant + fever. */
export function detectUrgent(ageMonths: number, text: string): boolean {
  const s = (text || '').toLowerCase();
  const redWords = [
    // TR — use stems so verb forms are caught too (e.g. "morar" → morarma,
    // morardı, morarıyor; cyanosis is a critical sign we must not miss).
    'nefes','solunum','zor','zorluk','morar','mosmor','mavi','havale','nöbet','nobet','bilinç','bayıl','tepkisiz','hırıltı','hirilti',
    // EN
    'breath','breathing','cyanosis','blue','seizure','convulsion','unconscious','unresponsive','wheezing',
  ];
  const hasRed = redWords.some((w) => s.includes(w));
  const hasFeverTR = /(?:38(\.|,)?\d?)/.test(s) || s.includes('38 derece');
  const hasFeverEN = /(?:\b38(?:\.\d)?\b)/.test(s) || s.includes('38 c') || s.includes('38°');
  const smallInfant = ageMonths >= 0 && ageMonths < 3 && (hasFeverTR || hasFeverEN);
  return hasRed || smallInfant;
}

/**
 * Emergency decision:
 * - any temp ≥ 40°C, or
 * - under 3 months old with temp ≥ 38°C, or
 * - any red-flag sign.
 */
export function evaluateRisk(ageMonths: number, q: string): { emergency: boolean; temp: number | null } {
  const t = extractTempC(q);
  const emergency =
    (t !== null && t >= 40) ||
    (ageMonths < 3 && t !== null && t >= 38) ||
    detectUrgent(ageMonths, q);
  return { emergency, temp: t };
}

/**
 * Route between the two answer models: the fast one (flash-lite, ~1.2s, no
 * hidden "thinking" phase) and the deep one (pro, ~13s, richer answers but far
 * costlier). We only pay pro's latency/cost when it's likely to matter:
 *
 *  - urgent           → a red-flag-adjacent question; a careful answer is worth
 *                       the wait more than raw speed is.
 *  - long / multi-part / multi-symptom → genuinely involved, benefits from
 *                       stronger reasoning.
 *
 * Short, single-topic questions take the fast path — flash-lite is already
 * strong there and ~10x faster.
 *
 * NOTE We deliberately do NOT route on "did a FAQ match": the route's keyword
 * overlap score is stopword-dominated noise (measured — a concerning umbilical-
 * bleeding question scored higher than a plain constipation one), so it can't
 * reliably tell an off-content ask from an on-content one. The signals below
 * are the ones that actually track question difficulty.
 */
export function needsDeepModel(opts: {
  question: string;
  urgent: boolean;
}): boolean {
  const { question, urgent } = opts;
  if (urgent) return true;

  const q = (question || '').trim();
  const ql = q.toLowerCase();

  if (q.length >= 160) return true;

  // Two or more question marks usually means the user stacked questions.
  if ((q.match(/[?？]/g) || []).length >= 2) return true;

  // Two or more distinct symptom concepts → more to reason about. Each group
  // holds TR / accent-free / EN variants of ONE concept so a bilingual mention
  // of the same symptom isn't double-counted. Stems are chosen to avoid
  // false friends — e.g. teething ("diş") is intentionally left out because it
  // is a substring of "endişe" (worry), which appears in a huge share of
  // anxious-parent questions and would wrongly push them onto the slow path.
  const symptomGroups = [
    ['ateş', 'ates', 'fever'],
    ['kus', 'vomit', 'istifra'],
    ['ishal', 'diarr'],
    ['öksür', 'oksur', 'cough', 'hırıl', 'hiril', 'wheez'],
    ['döküntü', 'dokuntu', 'rash'],
    ['nefes', 'solunum', 'breath'],
    ['uyku', 'sleep'],
    ['kabız', 'kabiz', 'constip'],
  ];
  const conceptsHit = symptomGroups.filter((g) => g.some((w) => ql.includes(w))).length;
  if (conceptsHit >= 2) return true;

  return false;
}

/** Local emergency number from a country code (falls back to 112). */
export function emergencyNumber(country?: string | null): string {
  const map: Record<string, string> = {
    US: '911', CA: '911', MX: '911',
    AU: '000', NZ: '111', GB: '999',
  };
  // 112 is valid across the EU, Turkey, India and much of the world.
  return map[(country || '').toUpperCase()] || '112';
}
