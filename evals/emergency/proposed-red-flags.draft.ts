// DRAFT — doctor review pending (see PROPOSED_RED_FLAGS.md). Not used by the app.
// Run: npx tsx evals/emergency/proposed-red-flags.draft.ts
import { readFileSync } from 'node:fs';
import { evaluateRisk } from '../../lib/askLogic';

export const PROPOSED: Record<string, RegExp[]> = {
  breathing: [
    /(göğsü|gogsu|göğüs|gogus)\S*\s+(\S+\s+)?(içeri|iceri)\s+(çek|cek)/,
    /kaburga\S*\s+(\S+\s+)?(görün|gorun|çekil|cekil|belir)/,
    /burun kanat/,
    /(retraction|ribs (are )?showing|sucking in|nostrils flar|flaring nostrils|head bobbing)/,
  ],
  cyanosis: [/lacivert/, /mavimsi/, /(kül|kul) rengi/, /(face|lips|skin)\s+(is |looks |went |turned )?(\w+ )?(grey|gray|ashen)/],
  seizure: [
    /(gözleri|gozleri)\s+(\S+\s+)?(kay|dön|don\b|dondu|sabitlen)/,
    /(kolları|kollari|bacakları|bacaklari|vücudu|vucudu|her yeri)\s+(\S+\s+)?(kasıl|kasil|sarsıl|sarsil|titre)/,
    /(kasılıp|kasilip|kasıldı ve|kasildi ve)\s+(sarsıl|sarsil|titre)/,
    /(ağzından|agzindan)\s+(köpük|kopuk)/,
    /eyes (rolled|rolling|rolled back)/, /(body|arms|legs) (was |were |is |are |kept )?(jerking|shaking|stiff)/, /went stiff/, /foaming at the mouth/,
  ],
  unresponsive: [
    /(uyandıramıyor|uyandiramiyor|uyandıramadım|uyandiramadim)/, /(çok|cok) (gevşek|gevsek)/, /bez bebek gibi/, /tepki vermiyor/, /kendinde değil|kendinde degil/,
    /(can'?t|cannot|hard to|unable to) wake/, /\b(floppy|limp)\b/, /not responding/,
  ],
  meningitis: [
    /solmayan|bastırınca (geçmeyen|solmayan|kaybolmayan)|bastirinca (gecmeyen|solmayan)|bardak testi/,
    /ense\S*\s+(\S+\s+)?(sert|tutul)/, /(başını|basini|boynunu)\s+(öne\s+)?(eğemiyor|egemiyor)/, /(bıngıldak|bingildak)\S*\s+(şiş|sis|kabar)/,
    /(doesn'?t|does not|won'?t) fade|non-?blanching|glass test/, /stiff neck|neck is stiff/, /bulging (fontanelle|soft spot)/,
  ],
  dehydration: [
    /(bıngıldak|bingildak)\S*\s+(çök|cok)/, /saattir\s+(\S+\s+)?(altı|alti|bezi|çiş|cis|idrar)\S*\s+(\S+\s+)?(ıslanmadı|islanmadi|yapmadı|yapmadi|yok)/,
    /(yeşil|yesil|safralı|safrali|kanlı|kanli)\s+(kus)/,
    /no wet (diaper|nappy|nappies|diapers)/, /sunken (soft spot|fontanelle|eyes)/, /(green|bloody|bile) vomit|vomiting (green|blood)/,
  ],
  poisoning: [
    /(pil|mıknatıs|miknatis|deterjan|kapsül|kapsul|çamaşır suyu|camasir suyu|ilaç|ilac|hap|tiner|gazyağı|gazyagi|kimyasal)\S*\s+(\S+\s+){0,3}(yut|iç|ic\b|içti|icti|yala|ağzına al|agzina al)/,
    /(yuttu|içti|icti|yaladı|yaladi)\s+(\S+\s+){0,2}(pil|mıknatıs|deterjan|kapsül|ilaç|hap)/,
    /zehirlen/,
    /\b(swallow|drank|ate|ingest|chewed)\S*\s+(\S+\s+){0,3}(battery|batteries|magnet|bleach|detergent|pod|pills?|medicine|tablets?|chemical)/,
    /button batter/, /poison/,
  ],
  choking: [
    /(boğazına|bogazina)\s+(\S+\s+)?(takıl|takil)/, /(boğuluyor|boguluyor)/, /(sesi çıkmıyor|sesi cikmiyor|öksüremiyor|oksuremiyor|ağlayamıyor|aglayamiyor)/,
    /\bchoking\b/, /stuck in (his|her|the) throat/, /(can'?t|cannot) (cough|cry)/,
  ],
  headInjury: [
    /(düş|dus|çarp|carp|vurdu)[^.!?]{0,60}(kus|uykulu|bayıl|bayil|bilinc|bilinç|kulağından|kulagindan)/,
    /(fell|hit (his|her) head|bumped (his|her) head)[^.!?]{0,60}(vomit|threw up|sleepy|drowsy|unconscious|passed out)/,
  ],
};

// Tricky routine questions: proposals must NOT fire on these.
export const TRICKY_ROUTINE = [
  'bebek kıyafetlerini hangi deterjanla yıkamalıyım?',
  'karnı kasılıyor, gaz sancısı mı?',
  'geceleri hiç uyanmıyor, normal mi?',
  'püre yerken öğürüyor, boğulur mu diye korkuyorum',
  'uykuda kolları seğiriyor, normal mi?',
  'D vitamini damlasını ne zaman içmeli?',
  'oğlum yürürken düştü dizini çarptı, ağladı geçti',
  'emzirirken süt boğazına kaçıyor, öksürüyor sonra düzeliyor',
  'which detergent is safe for baby clothes?',
  'he chokes a little on milk sometimes but recovers fast',
  'bunu çekecek gücüm kalmadı', 'mama yerken çok geç kaldık ilaç saatine', 'she was late taking her medicine',
  'kolları gevşek uyuyor, normal mi', 'zehirli bitkiler hangileri', 'kafasını yatağa vurup ağlıyor',
  'her hands look a bit grey when cold',
  'bebeğim çok sakin, ağlamıyor bile',
];

const cases = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8')).cases;
const hit = (q: string) => Object.entries(PROPOSED).filter(([, rs]) => rs.some((r) => r.test(q.toLowerCase()))).map(([k]) => k);
let caught = 0, em = 0;
for (const c of cases) {
  const base = evaluateRisk(c.ageMonths, c.question).emergency;
  const p = hit(c.question);
  const flagged = base || p.length > 0;
  if (c.expect === 'emergency') { em++; if (flagged) caught++; else console.log('STILL MISSED', c.id); }
  else if (flagged) console.log('FALSE ALARM', c.id, p);
}
console.log(`sensitivity ${caught}/${em}`);
for (const q of TRICKY_ROUTINE) { const p = hit(q); if (p.length) console.log('TRICKY FIRES', p, '—', q); }
