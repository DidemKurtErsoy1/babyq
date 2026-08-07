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
 * Topic stems (TR incl. accent-free / EN) for the subjects our FAQ library
 * covers. Stems (not whole words) so inflected Turkish still matches:
 * "uyu" catches uyku / uyuyor / uyuyamıyor; "ates" catches ateşi / atesli.
 */
const TOPIC_STEMS: Record<string, string[]> = {
  fever:        ['ateş', 'ates', 'fever', 'humma'],
  sleep:        ['uyku', 'uyu', 'sleep', 'uyan', 'nap'],
  cough:        ['öksür', 'oksur', 'cough', 'hırıl', 'hiril', 'wheez', 'balgam'],
  diarrhea:     ['ishal', 'diyare', 'diarr'],
  vomiting:     ['kusma', 'kusuyor', 'kustu', 'vomit', 'istifra'],
  constipation: ['kabız', 'kabiz', 'constip', 'kaka yapam'],
  feeding:      ['emzir', 'mama', 'beslen', 'süt', 'sut', 'feed', 'solid', 'gıda', 'gida', 'iştah', 'istah', 'appetite', 'yemek ye'],
  rash:         ['döküntü', 'dokuntu', 'rash', 'kızarık', 'kizarik', 'pişik', 'pisik', 'eczema', 'egzama'],
  breathing:    ['nefes', 'solunum', 'breath'],
  teething:     ['diş çık', 'dis cik', 'teeth'],
  vaccine:      ['aşı', 'asi', 'vaccin', 'immuniz'],
};

/** Which of our known topics a free-text question is about (may be empty). */
export function detectTopics(text: string): string[] {
  const s = (text || '').toLowerCase();
  return Object.entries(TOPIC_STEMS)
    .filter(([, stems]) => stems.some((st) => s.includes(st)))
    .map(([topic]) => topic);
}

/**
 * Relevance of one FAQ entry to a question, used to decide whether it may be
 * shown to the user as a source.
 *
 * Why this exists: the previous scoring counted raw substring hits for EVERY
 * word in the question, stopwords included — so "i" and "can" matched almost
 * any entry and the top-2 were essentially random. That surfaced, for example,
 * a fever FAQ as the "source" for "who won the world cup". Citing a source that
 * did not inform the answer is worse than citing none, so scoring now requires
 * a real topical overlap.
 */
export function faqRelevance(
  question: string,
  faq: { category?: string | null; question?: string | null; answer?: string | null }
): number {
  const qTopics = detectTopics(question);
  const hay = `${faq.category ?? ''} ${faq.question ?? ''} ${faq.answer ?? ''}`.toLowerCase();

  // What an entry is ABOUT (its category + title) counts far more than a topic
  // merely mentioned in passing in its body — otherwise a cough entry whose
  // answer happens to say "fever" gets cited as a source for a fever question.
  const subject = `${faq.category ?? ''} ${faq.question ?? ''}`.toLowerCase();
  const subjectTopics = detectTopics(subject);
  const bodyTopics = detectTopics(`${faq.answer ?? ''}`);

  let score = 0;
  for (const t of qTopics) {
    if (subjectTopics.includes(t)) score += 4;      // the entry is about this
    else if (bodyTopics.includes(t)) score += 1;    // only mentioned in passing
  }

  // Meaningful (non-stopword, ≥4 chars) word overlap adds a little confidence,
  // but can never on its own qualify an entry as a source.
  const stop = new Set([
    'bebek', 'bebeğim', 'bebegim', 'çocuk', 'cocuk', 'baby', 'child', 'kid',
    'için', 'icin', 'ile', 'daha', 'çok', 'cok', 'nasıl', 'nasil', 'neden',
    'olur', 'oldu', 'yapmalıyım', 'yapmaliyim', 'ne', 'mi', 'mı', 'var', 'yok',
    'what', 'when', 'should', 'have', 'does', 'with', 'this', 'that', 'from',
    'about', 'there', 'their', 'they', 'been', 'will', 'would', 'could',
  ]);
  const words = new Set(
    (question || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stop.has(w))
  );
  for (const w of words) if (hay.includes(w)) score += 1;

  return score;
}

/** Minimum relevance to cite an entry: it must be ABOUT a topic in the question. */
export const FAQ_SOURCE_MIN_SCORE = 4;

/** Local emergency number from a country code (falls back to 112). */
export function emergencyNumber(country?: string | null): string {
  const map: Record<string, string> = {
    US: '911', CA: '911', MX: '911',
    AU: '000', NZ: '111', GB: '999',
  };
  // 112 is valid across the EU, Turkey, India and much of the world.
  return map[(country || '').toUpperCase()] || '112';
}
