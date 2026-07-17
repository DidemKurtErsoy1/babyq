// app/api/ask/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, maybeSweep, clientIp } from '../../../lib/rateLimit';

/** ------------ Types ------------ */
type Faq = {
  id: string;
  age_min: number;
  age_max: number;
  category: string | null;
  question: string;
  answer: string;
  source?: string | null;
  created_at?: string;
};

/** ------------ Constants (TR/EN) ------------ */
const DISCLAIMER_TR =
  'Bu içerik tıbbi tavsiye değildir. Acil durumda 112’yi arayın veya en yakın sağlık kuruluşuna başvurun.';
const DISCLAIMER_EN =
  'This content is not medical advice. In an emergency, call your local emergency number or visit the nearest healthcare facility.';

const UI = {
  TR: {
    tooShort:
      'Ön değerlendirme: Soru çok kısa. Lütfen şunları ekleyin:\n• Bebeğin yaşı (ay)\n• En yüksek ateş ve nasıl ölçtünüz\n• Eşlik eden belirtiler (nefes darlığı, kusma vb.)',
    urgentTitle: '🔺 ACİL UYARI',
    urgentBody: (t?: number | null) =>
      `${t ? `• Bildirilen ateş: yaklaşık ${t}°C.\n` : ''}` +
      '• 40°C ve üzeri ateş veya 3 aydan küçük bebekte ≥38°C acil değerlendirme gerektirebilir.\n' +
      '• Hemen sağlık kuruluşuna başvurun veya 112’yi arayın.\n' +
      '• İnce giydirin, serin ortam sağlayın; sık sık sıvı teklif edin.\n' +
      '• Soğuk duş/alkollü ovma uygulamayın; ilaç dozu bilgisi veremem.',
    fallback:
      '🔺 İlk değerlendirme: Metne göre acil risk görünmüyor. Çocuğu gözlemleyin ve sıvı alımını sürdürün. Belirtiler artarsa sağlık profesyoneline başvurun.',
    disclaimer: DISCLAIMER_TR,
    sys:
      'Pediatri asistanısın; tanı koyma ve ilaç/doz yazma. Türkçe, kısa ve sakin yaz. Çıktı biçimi: 1 kısa özet cümle; 3 madde pratik öneri; 1 madde “Ne zaman doktora?”. Acil belirti varsa başta ACİL uyarı ver. Toplam ≤90 kelime.'
  },
  EN: {
    tooShort:
      'Pre-check: Your question seems too short. Please add:\n• Baby age (months)\n• Highest measured temperature and how you measured\n• Any accompanying symptoms (breathing difficulty, vomiting, etc.)',
    urgentTitle: '🔺 URGENT WARNING',
    urgentBody: (t?: number | null) =>
      `${t ? `• Reported temperature: ~${t}°C.\n` : ''}` +
      '• ≥40°C fever or infants <3 months with ≥38°C may require immediate evaluation.\n' +
      '• Seek medical care now or call your local emergency number.\n' +
      '• Dress lightly, keep a cool/ventilated room; offer fluids frequently.\n' +
      '• Do NOT use cold baths or alcohol rubs; no dosing instructions provided.',
    fallback:
      '🔺 Initial assessment: No immediate red flag detected from your text. Monitor your child and keep up with fluids. If symptoms worsen or new red flags appear, seek medical care.',
    disclaimer: DISCLAIMER_EN,
    sys:
      'You are a pediatric assistant; do NOT diagnose or prescribe. English only. Output format: one short summary sentence; three actionable bullet tips; one bullet “When to see a doctor?”. If urgent red flags exist, start with an URGENT warning. Keep total ≤90 words.'
  }
} as const;

/** ------------ Helpers ------------ */
function cut(s: string, max = 400) {
  if (!s) return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

// Basit TR/EN dil tespiti (+ ?lang=tr|en override)
function detectLang(text: string, req: Request): 'TR' | 'EN' {
  const url = new URL(req.url);
  const override = url.searchParams.get('lang');
  if (override?.toLowerCase() === 'tr') return 'TR';
  if (override?.toLowerCase() === 'en') return 'EN';

  const s = (text || '').toLowerCase();

  // Turkish diacritics are the strongest signal, when present.
  if (/[çğışöü]/.test(s)) return 'TR';

  // Turkish present-continuous (-yor) and question-particle (mi/mı/mu/mü)
  // suffixes are distinctive and survive even when diacritics are dropped
  // (very common in fast, informal typing — e.g. "agliyor", "iyi mi").
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
  if (trWords.some(w => new RegExp(`\\b${w}\\b`).test(s))) return 'TR';

  return 'EN';
}

function detectUrgent(ageMonths: number, text: string) {
  const s = (text || '').toLowerCase();
  const redWords = [
    // TR
    'nefes','solunum','zor','zorluk','morarma','mavi','havale','nöbet','nobet','bilinç','bayıl','tepkisiz','hırıltı','hirilti',
    // EN
    'breath','breathing','cyanosis','blue','seizure','convulsion','unconscious','unresponsive','wheezing'
  ];
  const hasRed = redWords.some(w => s.includes(w));
  const hasFeverTR = /(?:38(\.|,)?\d?)/.test(s) || s.includes('38 derece');
  const hasFeverEN = /(?:\b38(?:\.\d)?\b)/.test(s) || s.includes('38 c') || s.includes('38°');
  const smallInfant = ageMonths >= 0 && ageMonths < 3 && (hasFeverTR || hasFeverEN);
  return hasRed || smallInfant;
}

function extractTempC(q: string): number | null {
  const s = (q || '').toLowerCase();
  const m = s.match(/(\d{2}(?:[.,]\d)?)(?:\s?°\s?c| ?c| ?derece)?/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  if (isNaN(n) || n < 30 || n > 45) return null;
  return n;
}

function evaluateRisk(ageMonths: number, q: string) {
  const t = extractTempC(q);
  const emergency =
    (t !== null && t >= 40) ||
    (ageMonths < 3 && t !== null && t >= 38) ||
    detectUrgent(ageMonths, q);
  return { emergency, temp: t };
}

function extractKeywords(q: string) {
  const base = (q || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const extras: string[] = [];
  if (base.some(w => ['ateş','ates','fever'].includes(w))) extras.push('ateş');
  if (base.some(w => ['öksürük','oksuruk','cough','wheeze','wheezing','hırıltı','hirilti','balgam','phlegm'].includes(w))) extras.push('öksürük');
  if (base.some(w => ['ishal','diarrhea','diare'].includes(w))) extras.push('ishal');
  if (base.some(w => ['kusma','vomit','vomiting','istifra'].includes(w))) extras.push('kusma');
  if (base.some(w => ['kabız','constipation','kabizlik','hard stool'].includes(w))) extras.push('kabızlık');
  if (base.some(w => ['uyku','sleep'].includes(w))) extras.push('uyku');
  if (base.includes('ek') && base.some(w => ['gıda','gida','feeding','solid'].includes(w))) extras.push('ek gıda');

  return Array.from(new Set([...base, ...extras])).slice(0, 12);
}

function supabaseServer() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** ------------ Gemini (short, resilient) ------------ */
async function geminiGenerate(prompt: string) {
  const key = process.env.GEMINI_API_KEY!;
  if (!key) throw new Error('GEMINI_API_KEY yok');

  // "-latest" aliases always point at Google's current recommended model,
  // so this list doesn't need updating every time a dated model id is retired.
  const MODELS = ['gemini-flash-lite-latest','gemini-flash-latest','gemini-pro-latest'];

  let lastError: string | null = null;
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: { temperature: 0.2, maxOutputTokens: 140, candidateCount: 1 }
      })
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      lastError = j?.error?.message || `HTTP ${res.status}`;
      continue; // try the next model in the fallback chain
    }
    const parts = j?.candidates?.[0]?.content?.parts || [];
    const text  = parts.map((p:any)=>p?.text).filter(Boolean).join('\n').trim();
    if (text) return { text };
  }

  throw new Error(lastError || 'no_model_available_or_empty');
}

async function askGeminiSmart(
  ageMonths: number,
  question: string,
  faqs: Faq[],
  urgent: boolean,
  lang: 'TR' | 'EN'
) {
  const system = UI[lang].sys;

  const ctx =
    faqs.length
      ? (lang === 'TR' ? 'Kısa FAQ bağlamı:\n' : 'Brief FAQ context:\n') +
        faqs.map((f,i) =>
          lang === 'TR'
            ? `- [${i+1}] ${f.category ?? ''} • ${f.age_min}-${f.age_max} ay\nS: ${cut(f.question,100)}\nC: ${cut(f.answer,180)}`
            : `- [${i+1}] ${f.category ?? ''} • ${f.age_min}-${f.age_max} months\nQ: ${cut(f.question,100)}\nA: ${cut(f.answer,180)}`
        ).join('\n')
      : (lang === 'TR'
          ? 'İlgili FAQ bulunamadı. Genel ama güvenli öneri yaz.'
          : 'No related FAQ found. Provide general yet safe guidance.');

  const user =
    (lang === 'TR'
      ? `Bebek yaşı: ${ageMonths} ay\nSoru: ${cut(question, 140)}`
      : `Baby age (months): ${ageMonths}\nQuestion: ${cut(question, 140)}`
    ) +
    `\n\n${ctx}` +
    (urgent
      ? (lang === 'TR'
          ? '\n\nÖNEMLİ: Metinde olası acil belirti var; önce ACİL uyar.'
          : '\n\nIMPORTANT: Possible urgent sign; start with URGENT warning.')
      : '');

  try {
    const r1 = await geminiGenerate(cut(`System:\n${system}\n\nUser:\n${user}`, 1600));
    return { text: r1.text, llmUsed: true, llmError: null, provider: 'gemini' as const };
  } catch {
    const user2 =
      lang === 'TR'
        ? `Yaş: ${ageMonths} ay. Soru: ${cut(question, 140)}. ${urgent ? 'Acil olabilir; ACİL uyarı ile başla. ' : ''}En fazla 5 kısa satır.`
        : `Baby age: ${ageMonths} months. Question: ${cut(question, 140)}. ${urgent ? 'Urgent possible; start with URGENT. ' : ''}Max 5 short lines.`;
    try {
      const r2 = await geminiGenerate(cut(`System:\n${system}\n\nUser:\n${user2}`, 800));
      return { text: r2.text, llmUsed: true, llmError: null, provider: 'gemini' as const };
    } catch (e2:any) {
      return { text: null, llmUsed: false, llmError: String(e2?.message || e2), provider: 'gemini' as const };
    }
  }
}

/** ------------ GET ------------ */
export async function GET() {
  return NextResponse.json({ ok: true });
}

/** ------------ POST ------------ */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    // Tally webhook (opsiyonel)
    let ageMonths = Number(body?.ageMonths ?? 0);
    let question = (body?.question ?? '').toString();
    const userId: string | null = body?.userId ?? null;
    const sex: string | null = body?.sex ?? null;
    const babyId: string | null = body?.babyId ?? null;
    if ((!ageMonths || !question) && body?.data?.fields?.length) {
      const fields: any[] = body.data.fields;
      const ageField = fields.find(f => /age|yaş|yas/i.test(f?.key || f?.label));
      const qField   = fields.find(f => /question|soru/i.test(f?.key || f?.label));
      if (ageField) ageMonths = Number(ageField.value || 0);
      if (qField)   question  = (qField.value || '').toString();
    }
    if (Number.isNaN(ageMonths) || ageMonths < 0) ageMonths = 0;

    // Dil tespiti (query `?lang=tr|en` override eder)
    const lang: 'TR' | 'EN' = detectLang(question, req);
    const L = UI[lang];

    // Rate limiting — protects against abuse / Gemini bill-shock.
    // Real parents never approach these; a scripted flood trips instantly.
    const ip = clientIp(req);
    maybeSweep(60 * 60 * 1000);
    const perMinute = rateLimit(`ask:min:${ip}`, { limit: 12, windowMs: 60_000 });
    const perHour = perMinute.ok ? rateLimit(`ask:hr:${ip}`, { limit: 60, windowMs: 60 * 60_000 }) : perMinute;
    if (!perMinute.ok || !perHour.ok) {
      const retryAfterSec = !perMinute.ok ? perMinute.retryAfterSec : (perHour as { retryAfterSec: number }).retryAfterSec;
      const msg = lang === 'TR'
        ? 'Çok fazla istek gönderildi. Lütfen kısa bir süre bekleyip tekrar deneyin.'
        : 'Too many requests. Please wait a moment and try again.';
      return NextResponse.json(
        {
          answer: msg,
          candidates: [],
          disclaimer: L.disclaimer,
          meta: { source: 'FALLBACK', llmUsed: false, llmError: null, provider: 'rate-limit', matchedFaqs: 0, urgent: false },
        },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      );
    }

    if (!question?.trim()) {
      return NextResponse.json(
        { error: lang === 'TR' ? 'Eksik parametre: question' : 'Missing parameter: question' },
        { status: 400 }
      );
    }

    // Çok kısa soru
    if (question.trim().length < 12) {
      return NextResponse.json({
        answer: L.tooShort,
        candidates: [],
        disclaimer: L.disclaimer,
        meta: { source: 'FALLBACK', llmUsed: false, llmError: null, provider: 'rules', matchedFaqs: 0, urgent: false }
      }, { status: 400 });
    }

    // Acil kuralı
    const risk = evaluateRisk(ageMonths, question);
    if (risk.emergency) {
      const urgentAnswer = `${L.urgentTitle}\n${L.urgentBody(risk.temp)}`;
      if (userId) {
        try {
          const supa = supabaseServer();
          await supa.from('questions').insert({
            user_id: userId,
            baby_id: babyId,
            child_age_months: ageMonths,
            text: question,
            answer: urgentAnswer,
            source: 'FALLBACK',
            sex,
            urgent: true,
          });
        } catch {}
      }
      return NextResponse.json({
        answer: urgentAnswer,
        candidates: [],
        disclaimer: L.disclaimer,
        meta: { source: 'FALLBACK', llmUsed: false, llmError: null, provider: 'rules', matchedFaqs: 0, urgent: true }
      });
    }

    const urgent = detectUrgent(ageMonths, question);

    // FAQ bağlamı (en fazla 2)
    let faqs: Faq[] = [];
    try {
      const supa = supabaseServer();
      const { data } = await supa
        .from('faqs')
        .select('*')
        .lte('age_min', ageMonths)
        .gte('age_max', ageMonths)
        .limit(20);

      const kws = extractKeywords(question);
      faqs = (data || [])
        .map((f: Faq) => {
          const hay = `${f.category ?? ''} ${f.question} ${f.answer}`.toLowerCase();
          const score = kws.reduce((acc, w) => (hay.includes(w) ? acc + 1 : acc), 0);
          return { ...f, _score: score } as any;
        })
        .sort((a:any,b:any)=> b._score - a._score)
        .slice(0, 2)
        .map((f:any)=>{ delete f._score; return f as Faq; });
    } catch { faqs = []; }

    // LLM çağrısı
    const { text: aiText, llmUsed, llmError, provider } =
      await askGeminiSmart(ageMonths, question, faqs, urgent, lang);

    let source: 'AI' | 'FAQ' | 'FALLBACK';
    let answer: string;

    if (aiText) {
      source = 'AI';
      answer = `🔹 AI\n${aiText}`;
    } else if (faqs.length) {
      source = 'FAQ';
      answer = `🔸 FAQ\n${faqs[0].answer}`;
    } else {
      source = 'FALLBACK';
      answer = UI[lang].fallback;
    }

    // Soruyu kaydet (best-effort)
    try {
      const supa = supabaseServer();
      await supa.from('questions').insert({
        user_id: userId,
        baby_id: babyId,
        child_age_months: ageMonths,
        text: question,
        answer,
        source,
        sex,
        urgent,
      });
    } catch {}

    return NextResponse.json({
      answer,
      candidates: faqs,
      disclaimer: L.disclaimer,
      meta: { source, llmUsed, llmError, provider, matchedFaqs: faqs.length, urgent }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Unprocessable request', detail: e?.message || 'unknown' },
      { status: 500 }
    );
  }
}
