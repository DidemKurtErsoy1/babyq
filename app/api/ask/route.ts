// app/api/ask/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

type Lang = 'tr' | 'en';

/** ------------ Constants ------------ */
const DISCLAIMER_EN =
  'This content is not medical advice. In emergencies, call your local emergency number or visit the nearest healthcare facility.';

const DISCLAIMER_TR =
  'Bu içerik tıbbi danışma değildir. Acil durumlarda 112’yi arayın veya en yakın sağlık kuruluşuna başvurun.';

/** ------------ Helpers ------------ */
function cut(s: string, max = 400) {
  if (!s) return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

function detectLangFromText(q: string): Lang {
  const s = (q || '').toLowerCase();
  const hasTrSignal =
    s.match(/[çğıöşü]/) || /merhaba|ateş|öksür|ishal|kusma|bebek|ay/.test(s);
  return hasTrSignal ? 'tr' : 'en';
}

function detectLang(req: Request, question: string): Lang {
  const url = new URL(req.url);
  const qp = url.searchParams.get('lang');
  if (qp === 'tr' || qp === 'en') return qp;

  const acceptLang = (req.headers.get('accept-language') || '').toLowerCase();
  if (/\btr\b/.test(acceptLang)) return 'tr';
  if (/\ben\b/.test(acceptLang)) return 'en';

  return detectLangFromText(question);
}

function detectUrgent(ageMonths: number, text: string) {
  const s = (text || '').toLowerCase();

  // TR & EN kırmızı bayrak kelimeleri
  const redWords = [
    // TR
    'nefes',
    'solunum',
    'zorluk',
    'morarma',
    'mavi',
    'havale',
    'nöbet',
    'nobet',
    'bilinç',
    'bayıl',
    'tepkisiz',
    'hırıltı',
    'hirilti',
    // EN
    'breath',
    'breathing',
    'trouble breathing',
    'cyanosis',
    'blue',
    'seizure',
    'unconscious',
    'faint',
    'unresponsive',
    'wheeze',
    'wheezing',
  ];
  const hasRed = redWords.some((w) => s.includes(w));

  // 38.x desenleri (TR/EN için yeterli)
  const hasFever =
    /(?:38(\.|,)?\d?)/.test(s) ||
    s.includes('38 derece') ||
    s.includes('38°');
  const smallInfant = ageMonths >= 0 && ageMonths < 3 && hasFever;

  return hasRed || smallInfant;
}

// Parse temperature values like: 38, 38.5, 38°, 38 C, 38 derece
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
    (t !== null && t >= 40) || // ≥40°C
    (ageMonths < 3 && t !== null && t >= 38) || // <3 months + ≥38°C
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
  if (base.some((w) => ['ateş', 'ates', 'ateşi', 'atesi', 'fever'].includes(w)))
    extras.push('ateş');
  if (
    base.some((w) =>
      [
        'öksürük',
        'oksuruk',
        'öksürüyor',
        'oksuruyor',
        'hırıltı',
        'hirilti',
        'balgam',
        'cough',
        'wheeze',
        'wheezing',
      ].includes(w),
    )
  )
    extras.push('öksürük');
  if (
    base.some((w) =>
      ['ishal', 'diare', 'diarrhea', 'sulu', 'kaka'].includes(w),
    )
  )
    extras.push('ishal');
  if (
    base.some((w) =>
      ['kusma', 'kustu', 'istifra', 'kusan', 'vomit', 'vomiting'].includes(w),
    )
  )
    extras.push('kusma');
  if (
    base.some((w) =>
      ['kabız', 'kabizlik', 'kabızlık', 'kabiz', 'constipation'].includes(w),
    )
  )
    extras.push('kabızlık');
  if (
    base.some((w) =>
      ['uyku', 'sleep', 'uyumuyor', 'gece', 'night'].includes(w),
    )
  )
    extras.push('uyku');
  if (base.includes('ek') && base.some((w) => ['gıda', 'gida'].includes(w)))
    extras.push('ek gıda');

  return Array.from(new Set([...base, ...extras])).slice(0, 12);
}

function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch (err) {
    console.error('Supabase server client init failed', err);
    return null;
  }
}

async function getUserIdFromAuthHeader(authHeader?: string | null) {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const supa = supabaseServer();
  if (!supa) return null;
  try {
    const { data } = await supa.auth.getUser(token);
    return data.user?.id ?? null;
  } catch (err) {
    console.warn('Auth token validation failed', err);
    return null;
  }
}

async function saveQuestionRecord(params: {
  userId: string | null;
  ageMonths: number;
  question: string;
  gender?: 'female' | 'male' | 'unknown' | null;
  imageUrl?: string;
  lang: Lang;
  source: 'AI' | 'FAQ' | 'FALLBACK';
  urgent: boolean;
  references: {
    id: string;
    question: string;
    category: string | null;
    age_min: number;
    age_max: number;
  }[];
}) {
  const supa = supabaseServer();
  if (!supa) return;
  try {
    await supa.from('questions').insert({
      user_id: params.userId,
      child_age_months: params.ageMonths,
      text: params.question,
      gender: params.gender ?? null,
      image_url: params.imageUrl || null,
      source: params.source,
      extras: {
        lang: params.lang,
        references: params.references,
        urgent: params.urgent,
      },
    } as any);
  } catch (err) {
    console.warn('Question save skipped', err);
  }
}

/** ------------ Gemini (short, resilient) ------------ */
async function geminiGenerate(prompt: string) {
  const key = process.env.GEMINI_API_KEY!;
  if (!key) throw new Error('GEMINI_API_KEY missing');

  const MODELS = [
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
  ];
  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 140,
          candidateCount: 1,
        },
      }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = j?.error?.message || `HTTP ${res.status}`;
      if (/not\s+found|unsupported|permission/i.test(msg)) continue;
      throw new Error(msg);
    }
    const parts = j?.candidates?.[0]?.content?.parts || [];
    const text = parts
      .map((p: any) => p?.text)
      .filter(Boolean)
      .join('\n')
      .trim();
    if (text) return { text };
  }
  throw new Error('no_model_available_or_empty');
}

function systemPrompt(lang: Lang) {
  if (lang === 'tr') {
    return (
      'Sen BabyQ adında, ebeveynlere yönelik bir bilgi asistanısın.' +
      ' Yanıtların KISA, sade ve sakin olsun (en fazla 4–5 madde).' +
      ' Tıbbi tanı koymazsın, ilaç veya doz önermessin.' +
      ' Aşağıdaki kurallara uy:\n' +
      '• Önce ebeveyni sakinleştir, sonrasında net ve uygulanabilir öneriler ver.\n' +
      '• Evde izlemeye uygun durumlarda “şunları takip et” diye maddeler kullan.\n' +
      '• Acil durumda mutlaka yüz yüze doktora veya 112’ye yönlendir.\n' +
      '• Tıbbi terimleri basit Türkçe ile açıkla.\n'
    );
  }

  return (
    'You are BabyQ, an assistant for parents of babies and young children.' +
    ' Your answers must be SHORT, simple and calm (max 4–5 bullet points).' +
    ' You never give diagnoses, drug names or doses.' +
    ' Follow these rules:\n' +
    '• Reassure the parent first, then give clear actionable advice.\n' +
    '• For non-emergencies, focus on home monitoring tips.\n' +
    '• For emergencies, clearly advise in-person evaluation or calling local emergency services.\n' +
    '• Explain medical terms in plain language.\n'
  );
}

function disclaimerFor(lang: Lang) {
  return lang === 'tr' ? DISCLAIMER_TR : DISCLAIMER_EN;
}

async function askGeminiSmart(
  ageMonths: number,
  question: string,
  faqs: Faq[],
  urgent: boolean,
  lang: Lang,
  gender?: 'female' | 'male' | 'unknown',
) {
  const sys = systemPrompt(lang);

  const ctx = faqs.length
    ? (lang === 'tr' ? 'Kısa SSS bağlamı:\n' : 'Brief FAQ context:\n') +
      faqs
        .map((f, i) =>
          lang === 'tr'
            ? `- [${i + 1}] ${f.category ?? ''} • ${f.age_min}-${f.age_max} ay\nS: ${cut(
                f.question,
                100,
              )}\nC: ${cut(f.answer, 180)}`
            : `- [${i + 1}] ${f.category ?? ''} • ${f.age_min}-${f.age_max} months\nQ: ${cut(
                f.question,
                100,
              )}\nA: ${cut(f.answer, 180)}`,
        )
        .join('\n')
    : lang === 'tr'
    ? 'İlgili SSS bulunamadı. Genel ama güvenli öneri ver.'
    : 'No related FAQ found. Provide general yet safe guidance.';

  const user =
    (lang === 'tr'
      ? `Bebek yaşı (ay): ${ageMonths}\nDil: Türkçe yanıtla (tamamen).\n`
      : `Baby age (months): ${ageMonths}\nLanguage: Respond purely in English.\n`) +
    (gender && gender !== 'unknown'
      ? lang === 'tr'
        ? `Cinsiyet: ${gender === 'female' ? 'kız' : 'erkek'}\n`
        : `Gender: ${gender}\n`
      : '') +
    (lang === 'tr'
      ? `Soru: ${cut(question, 140)}\n\n`
      : `Question: ${cut(question, 140)}\n\n`) +
    ctx +
    (urgent
      ? lang === 'tr'
        ? '\n\nÖNEMLİ: Metinde olası acil belirti var; sadece açıksa başta ACİL uyar.'
        : '\n\nIMPORTANT: Possible urgent sign; warn first ONLY if clearly indicated.'
      : '');

  try {
    const r1 = await geminiGenerate(cut(`System:\n${sys}\n\nUser:\n${user}`, 1600));
    return {
      text: r1.text,
      llmUsed: true,
      llmError: null,
      provider: 'gemini' as const,
    };
  } catch {
    try {
      const user2 =
        (lang === 'tr'
          ? `Yaş: ${ageMonths} ay. Soru: ${cut(question, 140)}. `
          : `Age: ${ageMonths} months. Question: ${cut(question, 140)}. `) +
        (urgent
          ? lang === 'tr'
            ? 'Acil olabilir; sadece açıksa ACİL uyar.'
            : 'Urgent possible; warn only if clearly indicated.'
          : '') +
        (lang === 'tr'
          ? ' En fazla 5 kısa satır.'
          : ' Max 5 short lines.');
      const r2 = await geminiGenerate(
        cut(`System:\n${sys}\n\nUser:\n${user2}`, 800),
      );
      return {
        text: r2.text,
        llmUsed: true,
        llmError: null,
        provider: 'gemini' as const,
      };
    } catch (e2: any) {
      return {
        text: null,
        llmUsed: false,
        llmError: String(e2?.message || e2),
        provider: 'gemini' as const,
      };
    }
  }
}

/** ----------- GET ----------- */
export async function GET() {
  return NextResponse.json({ ok: true });
}

/** ------------ POST ------------ */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const authHeader = req.headers.get('authorization');
    const userId = await getUserIdFromAuthHeader(authHeader);

    // Inputs
    let ageMonths = Number(body?.ageMonths ?? 0);
    let question = (body?.question ?? '').toString();
    const gender = body?.gender ?? body?.sex;
    const imageUrl = (body?.imageUrl ?? '') as string;

    // Tally webhook (optional)
    if ((!ageMonths || !question) && body?.data?.fields?.length) {
      const fields: any[] = body.data.fields;
      const ageField = fields.find((f) =>
        /age|yaş|yas/i.test(f?.key || f?.label),
      );
      const qField = fields.find((f) =>
        /question|soru/i.test(f?.key || f?.label),
      );
      if (ageField) ageMonths = Number(ageField.value || 0);
      if (qField) question = (qField.value || '').toString();
    }

    if (!question?.trim()) {
      return NextResponse.json(
        { error: 'Missing parameter: question' },
        { status: 400 },
      );
    }
    if (Number.isNaN(ageMonths) || ageMonths < 0) ageMonths = 0;

    // Language (meta + behavior)
    const lang: Lang = detectLang(req, question);

    // Very short question → ask for details (localized)
    if (question.trim().length < 12) {
      const answer =
        lang === 'tr'
          ? 'Sorunuz çok kısa görünüyor. Lütfen şunları ekleyin:\n• Bebeğin yaşı (ay)\n• Ölçülen en yüksek ateş ve nasıl ölçtüğünüz\n• Eşlik eden belirti (nefes darlığı, kusma vb.)'
          : 'Your question seems too short. Please add:\n• Baby age in months\n• Highest measured temperature and how you measured it\n• Any accompanying symptoms (breathing difficulty, vomiting, etc.)';
      return NextResponse.json(
        {
          answer,
          candidates: [],
          disclaimer: disclaimerFor(lang),
          meta: {
            source: 'FALLBACK',
            llmUsed: false,
            llmError: null,
            provider: 'rules',
            matchedFaqs: 0,
            urgent: false,
            language: lang,
          },
        },
        { status: 400 },
      );
    }

    // Emergency rule
    const risk = evaluateRisk(ageMonths, question);
    if (risk.emergency) {
      const t = risk.temp;
      const source: 'FALLBACK' = 'FALLBACK';
      const references: any[] = [];
      const answer =
        lang === 'tr'
          ? '🔺 ACİL UYARI\n' +
            (t ? `• Bildirilen ateş: ~${t}°C.\n` : '') +
            '• 40°C ve üzeri ateş veya 3 aydan küçük bebekte ≥38°C acil değerlendirme gerektirebilir.\n' +
            '• Hemen bir sağlık kuruluşuna başvurun veya 112’yi arayın.\n' +
            '• İnce giydirin, serin/iyi havalanan ortam; sık sık sıvı teklif edin.\n' +
            '• Soğuk duş/alkollü ovma uygulamayın; doz/ilaç yazmam.'
          : '🔺 URGENT WARNING\n' +
            (t ? `• Reported temperature: ~${t}°C.\n` : '') +
            '• ≥40°C fever or infants <3 months with ≥38°C may require immediate evaluation.\n' +
            '• Seek medical care now or call your local emergency number.\n' +
            '• Dress lightly; keep a cool/ventilated room; offer fluids often.\n' +
            '• Do NOT use cold baths or alcohol rubs; no dosing provided.';

      await saveQuestionRecord({
        userId,
        ageMonths,
        question,
        gender: (gender as any) ?? null,
        imageUrl,
        lang,
        source,
        urgent: true,
        references,
      });
      return NextResponse.json({
        answer,
        candidates: [],
        disclaimer: disclaimerFor(lang),
        meta: {
          source,
          llmUsed: false,
          llmError: null,
          provider: 'rules',
          matchedFaqs: 0,
          urgent: true,
          language: lang,
        },
      });
    }

    const urgent = detectUrgent(ageMonths, question);

    // Candidate FAQs
    let faqs: Faq[] = [];
    try {
      const supa = supabaseServer();
      if (!supa) throw new Error('Supabase unavailable');
      const { data } = await supa
        .from('faqs')
        .select('*')
        .lte('age_min', ageMonths)
        .gte('age_max', ageMonths)
        .limit(20);

      const kws = extractKeywords(question);
      faqs = (data || [])
        .map((f: Faq) => {
          const hay = `${f.category ?? ''} ${f.question} ${
            f.answer
          }`.toLowerCase();
          const score = kws.reduce(
            (acc, w) => (hay.includes(w) ? acc + 1 : acc),
            0,
          );
          return { ...f, _score: score } as any;
        })
        .sort((a: any, b: any) => b._score - a._score)
        .slice(0, 2)
        .map((f: any) => {
          delete f._score;
          return f as Faq;
        });
    } catch {
      faqs = [];
    }

    // LLM
    const { text: aiText, llmUsed, llmError, provider } =
      await askGeminiSmart(ageMonths, question, faqs, urgent, lang, gender);

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
      answer =
        lang === 'tr'
          ? '🔺 Fallback\nÖn değerlendirme: Metne göre acil belirti görünmüyor. Çocuğu gözlemleyin, sıvı alımını takip edin. Belirtiler artarsa sağlık profesyoneline başvurun.'
          : '🔺 Fallback\nInitial assessment: no immediate danger detected based on your text. Monitor your child and keep up with fluids. If symptoms worsen or new red flags appear, seek medical care.';
    }

    const references = faqs.map((f) => ({
      id: f.id,
      question: f.question,
      category: f.category,
      age_min: f.age_min,
      age_max: f.age_max,
    }));

    await saveQuestionRecord({
      userId,
      ageMonths,
      question,
      gender: (gender as any) ?? null,
      imageUrl,
      lang,
      source,
      urgent,
      references,
    });

    return NextResponse.json({
      answer,
      candidates: faqs,
      disclaimer: disclaimerFor(lang),
      meta: {
        source,
        llmUsed,
        llmError,
        provider,
        matchedFaqs: faqs.length,
        urgent,
        language: lang,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Unprocessable request', detail: e?.message || 'unknown' },
      { status: 500 },
    );
  }
}
