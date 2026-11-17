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

// Words that, right after a number, mean it is NOT a temperature
// ("14 aylık", "38 dakika", "6 week old", "3 times"...).
const NON_TEMP_UNIT =
  /^\s*['’]?\s*(ay|aylık|aylik|hafta|haftalık|haftalik|gün|gun|günlük|gunluk|yaş|yas|dakika|dk|saat|saniye|sn|kez|kere|defa|kilo|kg|gr|gram|cm|ml|mg|months?|mo\b|weeks?|wk|days?|years?|yrs?|y\/o|yo\b|minutes?|mins?|hours?|hrs?|h\b|seconds?|secs?|times|lbs?|oz|%)/i;

/**
 * Parse a plausible body temperature (°C) from free text, or null.
 *
 * Scans EVERY number (not just the first: "14 aylık oğlumun ateşi 40.3" used
 * to read 14 and miss 40.3), skips numbers followed by an age/time/count unit,
 * and converts Fahrenheit when marked (°F, F, fahrenheit). When several
 * temperatures appear ("38'den 40.3'e çıktı") the highest wins — for triage,
 * the worst reading is the one that matters.
 */
export function extractTempC(q: string): number | null {
  const s = (q || '').toLowerCase();
  const re = /(\d{2,3}(?:[.,]\d+)?)\s*(°\s*[cf]\b|°|derece|celsius|fahrenheit|[cf]\b)?/gi;
  let best: number | null = null;
  for (const m of s.matchAll(re)) {
    // Part of a longer number (e.g. "2024", a phone number)? Skip.
    const before = s[m.index! - 1];
    if (before && /[\d.,]/.test(before)) continue;
    const v = parseFloat(m[1].replace(',', '.'));
    const unit = (m[2] || '').replace(/\s/g, '');
    const after = s.slice(m.index! + m[0].length);
    if (!unit && NON_TEMP_UNIT.test(after)) continue;

    const isF = unit === '°f' || unit === 'f' || unit === 'fahrenheit';
    let c: number;
    if (isF) {
      if (v < 93 || v > 113) continue;
      c = Math.round(((v - 32) * 5) / 9 * 10) / 10;
    } else {
      // A bare number must look like a body temperature; with an explicit
      // °C/derece marker we keep the original, wider window.
      if (unit ? v < 30 || v > 45 : v < 34 || v > 43) continue;
      c = v;
    }
    if (best === null || c > best) best = c;
  }
  return best;
}

/**
 * Red-flag phrases. Deliberately PHRASES, not single words: the old single
 * words caused false alarms on ordinary questions — "zor" (uykuya dalmakta
 * zorlanıyor), "mavi" (mavi gözler), "nefes" (nefesi kokuyor), "breath"
 * (bad breath), "blue" (baby blues), "nöbet" (nöbetçi eczane, gece nöbeti),
 * "bilinç" (bilinçli ebeveyn). Stems still cover Turkish inflection.
 */
const RED_FLAGS = [
  // TR — breathing
  'nefes almakta zor', 'nefes almakta güçlük', 'nefes almakta guclu', 'nefes alamı', 'nefes alami',
  'nefes almıyor', 'nefes almiyor', 'nefes darlığı', 'nefes darligi', 'nefesi daral', 'nefesi kesil',
  'zor nefes', 'nefes nefese', 'solunum güçlüğü', 'solunum guclugu', 'solunum zorluğu', 'solunum zorlugu',
  'solunum sıkıntı', 'solunum sikinti', 'hırıltı', 'hirilti',
  // TR — colour (cyanosis)
  'morar', 'mosmor', 'mavi oldu', 'mavileş', 'maviles', 'dudakları mavi', 'dudaklari mavi',
  // TR — seizure / consciousness
  'havale', 'nöbet geçir', 'nobet gecir', 'kasılma nöbet', 'bayıl', 'bayil', 'tepkisiz',
  'bilincini kayb', 'bilinci kapa', 'bilinç kayb', 'bilinc kayb',
  // EN — breathing
  'trouble breathing', 'difficulty breathing', 'hard to breathe', 'struggling to breathe',
  "can't breathe", 'cant breathe', 'cannot breathe', 'not breathing', 'stopped breathing',
  'short of breath', 'shortness of breath', 'labored breathing', 'laboured breathing',
  'with every breath', 'with each breath', 'gasping', 'wheezing',
  // EN — colour
  'cyanosis', 'turned blue', 'turning blue', 'blue lips', 'lips are blue', 'lips look blue', 'lips turned blue',
  // EN — seizure / consciousness
  'seizure', 'convulsion', 'unconscious', 'unresponsive', 'passed out', 'fainted',
];

/**
 * Looser patterns that catch the many ways parents describe the same signs
 * ("nefes alırken çok zorlanıyor", "breathing really fast and hard") without
 * going back to bare single words.
 */
const RED_FLAG_PATTERNS: RegExp[] = [
  // breathing word, then (within a few words) a difficulty word — TR
  /(nefes|solu)\S*[^.!?\n]{0,30}(zor|güçl|gucl|darl|daral|sıkış|sikis|sıkıntı|sikinti|kesil|duruyor|durdu|hızlı|hizli)/,
  /(zor|güçlükle|guclukle|hızlı hızlı|hizli hizli)\s+(nefes|solu)/,
  // EN
  /breath\S*[^.!?\n]{0,30}(hard|difficult|struggl|labou?r|very fast|really fast|rapid)/,
  /(trouble|difficulty|struggling|hard time|problems?)\s+(\w+\s+){0,2}breath/,
  // colour
  /(yüzü|yuzu|dudak\S*|dudaklar\S*|derisi|teni)\s+(\S+\s+)?(mavi|mor\b|morumsu|gri)/,
  /\b(is|looks?|went|turn\S*|going|face|lips)\s+(\w+\s+)?(blue|grey|gray)\b/,
  // named seizure types
  /(sara|epilepsi|ateşli|atesli|febril)\s+(nöbet|nobet)/,
];

/** True when the text contains a red-flag sign, or a young infant + fever. */
export function detectUrgent(ageMonths: number, text: string): boolean {
  const s = (text || '').toLowerCase();
  const hasRed = RED_FLAGS.some((w) => s.includes(w)) || RED_FLAG_PATTERNS.some((r) => r.test(s));
  // Use the real temperature parser: the old /38/ regex fired on "38 dakika".
  const t = extractTempC(s);
  const smallInfant = ageMonths >= 0 && ageMonths < 3 && t !== null && t >= 38;
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
