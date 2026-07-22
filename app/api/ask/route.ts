// app/api/ask/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, maybeSweep, clientIp } from '../../../lib/rateLimit';
import { detectLangFromText, evaluateRisk, detectUrgent, emergencyNumber } from '../../../lib/askLogic';

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
    urgentBody: (t: number | null | undefined, emrg: string) =>
      `${t ? `• Bildirilen ateş: yaklaşık ${t}°C.\n` : ''}` +
      '• 40°C ve üzeri ateş veya 3 aydan küçük bebekte ≥38°C acil değerlendirme gerektirebilir.\n' +
      `• Hemen sağlık kuruluşuna başvurun veya ${emrg}'yi arayın.\n` +
      '• İnce giydirin, serin ortam sağlayın; sık sık sıvı teklif edin.\n' +
      '• Soğuk duş/alkollü ovma uygulamayın; ilaç dozu bilgisi veremem.',
    fallback:
      '🔺 İlk değerlendirme: Metne göre acil risk görünmüyor. Çocuğu gözlemleyin ve sıvı alımını sürdürün. Belirtiler artarsa sağlık profesyoneline başvurun.',
    disclaimer: DISCLAIMER_TR,
    sys:
      'Pediatri asistanısın; tanı koyma, ilaç veya doz önerme. Türkçe, kısa ve sakin yaz. ' +
      'Yanıtı HER ZAMAN şu sırada kur: önce tek cümlelik sakin bir özet (madde işareti yok); ' +
      'sonra tam olarak üç öneri, her biri ayrı satırda "• " ile başlasın; ' +
      'en son "Ne zaman doktora?" ile başlayan tek bir satır. ' +
      'Tek madde işareti "• " olsun; hiçbir şeyi numaralandırma; başka simge kullanma. ' +
      'Verilen FAQ bağlamı konuyla ilgiliyse yanıtını ona dayandır ve onunla çelişme. ' +
      'ACİL uyarısını YALNIZCA gerçek acil kırmızı bayraklarda ekle (solunum güçlüğü, morarma, ' +
      'havale/nöbet, tepkisizlik, çok küçük bebekte yüksek ateş) ve o satıra "🔺 ACİL:" ile başla. ' +
      'Hafif/olağan belirtilerde (hafif öksürük, burun akıntısı, büyük bebekte hafif ateş) ' +
      'ASLA alarm verme; sakince güven ver. Toplam ≤90 kelime.'
  },
  EN: {
    tooShort:
      'Pre-check: Your question seems too short. Please add:\n• Baby age (months)\n• Highest measured temperature and how you measured\n• Any accompanying symptoms (breathing difficulty, vomiting, etc.)',
    urgentTitle: '🔺 URGENT WARNING',
    urgentBody: (t: number | null | undefined, emrg: string) =>
      `${t ? `• Reported temperature: ~${t}°C.\n` : ''}` +
      '• ≥40°C fever or infants <3 months with ≥38°C may require immediate evaluation.\n' +
      `• Seek medical care now or call ${emrg}.\n` +
      '• Dress lightly, keep a cool/ventilated room; offer fluids frequently.\n' +
      '• Do NOT use cold baths or alcohol rubs; no dosing instructions provided.',
    fallback:
      '🔺 Initial assessment: No immediate red flag detected from your text. Monitor your child and keep up with fluids. If symptoms worsen or new red flags appear, seek medical care.',
    disclaimer: DISCLAIMER_EN,
    sys:
      'You are a pediatric assistant; do NOT diagnose, prescribe, or give doses. Write in English, short and calm. ' +
      'ALWAYS order the reply as: first one calm summary sentence (no bullet); ' +
      'then exactly three tips, each on its own line starting with "• "; ' +
      'finally a single line starting with "When to see a doctor?". ' +
      'Use "• " as the only bullet; do not number anything; use no other symbol. ' +
      'If the provided FAQ context is relevant, ground your answer in it and do not contradict it. ' +
      'Add an URGENT warning ONLY for true emergency red flags (breathing difficulty, cyanosis/blue ' +
      'color, seizure, unresponsiveness, high fever in a very young infant), starting that line with "🔺 URGENT:". ' +
      'For mild/common symptoms (mild cough, runny nose, mild fever in an older baby) NEVER raise alarm; ' +
      'reassure calmly. Keep total ≤90 words.'
  }
} as const;

function localizedDisclaimer(lang: 'TR' | 'EN', emrg: string): string {
  return lang === 'TR'
    ? `Bu içerik tıbbi tavsiye değildir. Acil durumda ${emrg}'yi arayın veya en yakın sağlık kuruluşuna başvurun.`
    : `This content is not medical advice. In an emergency, call ${emrg} or visit the nearest healthcare facility.`;
}

/** ------------ Helpers ------------ */
function cut(s: string, max = 400) {
  if (!s) return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

// TR/EN detection with a ?lang=tr|en override; pure detection lives in lib.
function detectLang(text: string, req: Request): 'TR' | 'EN' {
  const override = new URL(req.url).searchParams.get('lang')?.toLowerCase();
  if (override === 'tr') return 'TR';
  if (override === 'en') return 'EN';
  return detectLangFromText(text);
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
// Single answer model, chosen from a measured quality probe (2026-07):
// flash-lite has no "thinking" phase → ~1.2-1.4s, cheap, and its answers are
// already strong (verified across a TR/EN battery incl. fever+diarrhea → ORS).
//
// A hybrid "deep" tier on gemini-pro-latest was tried and removed: pro is a
// thinking model that, on the live route, NEVER actually served an answer —
// measured 4/6 calls returned "high demand" errors and the 2 successes took
// 26s and 38s, past the abort timeout — so it only added 7-24s of latency
// before falling back to flash-lite anyway. gemini-flash-latest is also a
// thinking model and truncates (979 thought tokens → 41-token answer), so it's
// not a viable fallback either. flash-lite alone is the measured sweet spot.
// "-latest" aliases track Google's current model, so this needs no dated ids.
const FAST_MODEL = 'gemini-flash-lite-latest';

// Per-attempt latency ceiling — a safety net against a hung request; flash-lite
// normally answers in ~1.4s, so this is only ever hit on a network stall.
const MODEL_TIMEOUT_MS = 24_000;

async function geminiGenerate(prompt: string, models: string[]) {
  const key = process.env.GEMINI_API_KEY!;
  if (!key) throw new Error('GEMINI_API_KEY yok');

  let lastError: string | null = null;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }]}],
          // A high ceiling is safe: non-thinking models (flash-lite) stop as soon
          // as the answer is done (~180 tokens) and never pad to the limit, while
          // the thinking model (pro) needs the headroom so hidden reasoning
          // (~1.1k tokens) doesn't crowd out the visible answer. The "≤90 words"
          // prompt rule still governs the answer's actual length.
          // NB: thinkingConfig/thinkingBudget is rejected by these -latest aliases
          // (flash-lite/pro both 400 on it), so thinking can't be disabled here.
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            candidateCount: 1,
          }
        })
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastError = j?.error?.message || `HTTP ${res.status}`;
        continue; // try the next model in the fallback chain
      }
      const parts = j?.candidates?.[0]?.content?.parts || [];
      const text  = parts.map((p:any)=>p?.text).filter(Boolean).join('\n').trim();
      if (text) return { text, model };
    } catch (e: any) {
      // AbortError (timed out) or a network failure — fall through to the next
      // model rather than hanging or throwing out of the whole chain.
      lastError = e?.name === 'AbortError' ? `timeout after ${MODEL_TIMEOUT_MS}ms` : String(e?.message || e);
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(lastError || 'no_model_available_or_empty');
}

function babyProfileLine(
  lang: 'TR' | 'EN',
  ageMonths: number,
  sex: string | null,
  babyName: string | null
) {
  const name = (babyName || '').trim().slice(0, 40);
  if (lang === 'TR') {
    const sexTr = sex === 'female' ? ', kız' : sex === 'male' ? ', erkek' : '';
    return `Bebek: ${name ? name + ', ' : ''}${ageMonths} aylık${sexTr}`;
  }
  const sexEn = sex === 'female' ? ', girl' : sex === 'male' ? ', boy' : '';
  return `Baby: ${name ? name + ', ' : ''}${ageMonths} months old${sexEn}`;
}

async function askGeminiSmart(
  ageMonths: number,
  question: string,
  faqs: Faq[],
  urgent: boolean,
  lang: 'TR' | 'EN',
  sex: string | null,
  babyName: string | null
) {
  const system = UI[lang].sys;
  const name = (babyName || '').trim().slice(0, 40);
  const profile = babyProfileLine(lang, ageMonths, sex, babyName);
  const personalTouch = name
    ? (lang === 'TR' ? `\nYanıtı ${name} için sıcak ve kişisel bir dille yaz.` : `\nWrite the answer warmly and personally for ${name}.`)
    : '';

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
      ? `${profile}\nSoru: ${cut(question, 140)}`
      : `${profile}\nQuestion: ${cut(question, 140)}`
    ) +
    personalTouch +
    `\n\n${ctx}` +
    (urgent
      ? (lang === 'TR'
          ? '\n\nÖNEMLİ: Metinde olası acil belirti var; önce ACİL uyar.'
          : '\n\nIMPORTANT: Possible urgent sign; start with URGENT warning.')
      : '');

  const chain = [FAST_MODEL];

  try {
    const r1 = await geminiGenerate(cut(`System:\n${system}\n\nUser:\n${user}`, 1600), chain);
    return { text: r1.text, llmUsed: true, llmError: null, provider: 'gemini' as const, model: r1.model };
  } catch {
    const user2 =
      lang === 'TR'
        ? `${profile}. Soru: ${cut(question, 140)}.${personalTouch} ${urgent ? 'Acil olabilir; ACİL uyarı ile başla. ' : ''}En fazla 5 kısa satır.`
        : `${profile}. Question: ${cut(question, 140)}.${personalTouch} ${urgent ? 'Urgent possible; start with URGENT. ' : ''}Max 5 short lines.`;
    try {
      const r2 = await geminiGenerate(cut(`System:\n${system}\n\nUser:\n${user2}`, 800), chain);
      return { text: r2.text, llmUsed: true, llmError: null, provider: 'gemini' as const, model: r2.model };
    } catch (e2:any) {
      return { text: null, llmUsed: false, llmError: String(e2?.message || e2), provider: 'gemini' as const, model: null };
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
    const babyName: string | null = body?.babyName ?? null;
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

    // Local emergency number from Vercel's geo header (falls back to 112).
    const emrg = emergencyNumber(req.headers.get('x-vercel-ip-country'));
    const disclaimer = localizedDisclaimer(lang, emrg);

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
          disclaimer,
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
        disclaimer,
        meta: { source: 'FALLBACK', llmUsed: false, llmError: null, provider: 'rules', matchedFaqs: 0, urgent: false }
      }, { status: 400 });
    }

    // Acil kuralı
    const risk = evaluateRisk(ageMonths, question);
    if (risk.emergency) {
      const urgentAnswer = `${L.urgentTitle}\n${L.urgentBody(risk.temp, emrg)}`;
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
        disclaimer,
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
    const { text: aiText, llmUsed, llmError, provider, model } =
      await askGeminiSmart(ageMonths, question, faqs, urgent, lang, sex, babyName);

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
      disclaimer,
      meta: { source, llmUsed, llmError, provider, model: source === 'AI' ? model : null, matchedFaqs: faqs.length, urgent }
    });
  } catch (e: any) {
    // Structured, greppable log so server-side failures surface in Vercel's
    // function logs (the server-side half of error monitoring).
    console.error('[ask] unhandled error:', e?.message || e, e?.stack || '');
    return NextResponse.json(
      { error: 'Unprocessable request', detail: e?.message || 'unknown' },
      { status: 500 }
    );
  }
}
