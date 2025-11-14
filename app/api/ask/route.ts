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

/** ------------ Constants (TR/EN) ------------ */
const DISCLAIMER_EN =
  'This content is not medical advice. In emergencies, call your local emergency number or visit the nearest healthcare facility.';
const DISCLAIMER_TR =
  'Bu içerik tıbbi tavsiye değildir. Acil durumlarda 112’yi arayın veya en yakın sağlık kuruluşuna başvurun.';

/** ------------ Helpers ------------ */
function cut(s: string, max = 400) {
  if (!s) return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

// Basit dil algılama (TR karakterleri + yaygın kelimeler)
function detectLang(text: string): 'tr' | 'en' {
  const s = (text || '').toLowerCase();
  const hasTrChar = /[çğıöşü]/.test(s);
  const trHits = ['ve', 'ile', 'ateş', 'ates', 'öksürük', 'oksuruk', 'ishal', 'kusma', 'bebek', 'doktor', 'derece']
    .reduce((n, w) => n + (s.includes(w) ? 1 : 0), 0);
  const enHits = ['and', 'with', 'fever', 'cough', 'diarrhea', 'vomit', 'baby', 'doctor', 'degree', 'months']
    .reduce((n, w) => n + (s.includes(w) ? 1 : 0), 0);
  if (hasTrChar || trHits > enHits) return 'tr';
  return 'en';
}

function detectUrgent(ageMonths: number, text: string) {
  const s = (text || '').toLowerCase();
  const redWords = [
    'nefes','solunum','zor','zorluk','morarma','mavi',
    'havale','nöbet','nobet','bilinç','bayıl','tepkisiz',
    'hırıltı','hirilti','cyanosis','seizure','unresponsive','breath'
  ];
  const hasRed = redWords.some(w => s.includes(w));
  const hasFever = /(?:38(\.|,)?\d?)/.test(s) || s.includes('38 derece');
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
    (t !== null && t >= 40) ||                  // ≥40°C
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
  if (base.some(w => ['ateş','ates','ateşi','atesi','fever'].includes(w))) extras.push('ateş');
  if (base.some(w => ['öksürük','oksuruk','öksürüyor','oksuruyor','hırıltı','hirilti','balgam','cough'].includes(w))) extras.push('öksürük');
  if (base.some(w => ['ishal','diare','diarrhea','sulu','kaka'].includes(w))) extras.push('ishal');
  if (base.some(w => ['kusma','kustu','istifra','kusan','vomit','vomiting'].includes(w))) extras.push('kusma');
  if (base.some(w => ['kabız','kabizlik','kabızlık','kabiz','constipation'].includes(w))) extras.push('kabızlık');
  if (base.some(w => ['uyku','sleep','uyumuyor','gece','night'].includes(w))) extras.push('uyku');
  if (base.includes('ek') && base.some(w => ['gıda','gida'].includes(w))) extras.push('ek gıda');

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
  if (!key) throw new Error('GEMINI_API_KEY missing');

  const MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'];
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
      const msg = j?.error?.message || `HTTP ${res.status}`;
      if (/not\s+found|unsupported|permission/i.test(msg)) continue;
      throw new Error(msg);
    }
    const parts = j?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p: any) => p?.text).filter(Boolean).join('\n').trim();
    if (text) return { text };
  }
  throw new Error('no_model_available_or_empty');
}

async function askGeminiSmart(ageMonths: number, question: string, faqs: Faq[], urgent: boolean, lang: 'tr'|'en') {
  const systemTR =
    'Bir pediatri asistanısın; tanı koyma ve ilaç/doz verme. ' +
    'YANITI SADECE TÜRKÇE yaz. Ton: sakin, kısa, ebeveyn dostu. ' +
    'Biçim tam olarak:\n' +
    '• 1 kısa özet cümle.\n' +
    '• 3 madde uygulanabilir öneri.\n' +
    '• 1 madde: "Ne zaman doktora?"\n' +
    'Acil işaret varsa (**<3 ay + ≥38°C, solunum sıkıntısı, morarma, bilinç değişikliği**) önce **ACİL UYARI** yaz. Toplam ≤90 kelime.';
  const systemEN =
    'You are a pediatric assistant. Do NOT diagnose or prescribe doses. ' +
    'Answer ONLY in ENGLISH. Tone: calm, concise, parent-friendly. ' +
    'Format exactly:\n' +
    '• One short summary sentence.\n' +
    '• Three bullet actionable tips.\n' +
    '• One bullet: "When to see a doctor?"\n' +
    'If urgent red flags exist (<3 months + ≥38°C, breathing difficulty, cyanosis, altered consciousness), start with **URGENT**. Keep total ≤90 words.';

  const ctx = faqs.length
    ? (lang === 'tr'
        ? 'Kısa FAQ bağlamı:\n'
        : 'Brief FAQ context:\n') +
      faqs.map((f,i) =>
        `- [${i+1}] ${f.category ?? ''} • ${f.age_min}-${f.age_max} ${lang==='tr'?'ay':'months'}\n` +
        `${lang==='tr'?'S:':'Q:'} ${cut(f.question, 100)}\n${lang==='tr'?'C:':'A:'} ${cut(f.answer, 180)}`
      ).join('\n')
    : (lang === 'tr'
        ? 'İlgili FAQ bulunamadı. Genel ama güvenli öneriler ver.'
        : 'No related FAQ found. Provide general yet safe guidance.');

  const user =
    `${lang==='tr'?'Bebek yaşı':'Baby age'}: ${ageMonths} ${lang==='tr'?'ay':'months'}\n` +
    `${lang==='tr'?'Soru':'Question'}: ${cut(question, 140)}\n\n` +
    ctx +
    (urgent
      ? (lang==='tr'
          ? '\n\nÖNEMLİ: Metinde acil belirti olabilir; **ACİL UYARI** ile başla.'
          : '\n\nIMPORTANT: Possible urgent sign; start with **URGENT**.')
      : '');

  const system = lang === 'tr' ? systemTR : systemEN;

  // Try with context; then ultra-short fallback
  try {
    const r1 = await geminiGenerate(cut(`System:\n${system}\n\nUser:\n${user}`, 1600));
    return { text: r1.text, llmUsed: true, llmError: null, provider: 'gemini' as const };
  } catch {
    try {
      const user2 =
        `${lang==='tr'?'Yaş':'Age'}: ${ageMonths} ${lang==='tr'?'ay':'months'}. ` +
        `${lang==='tr'?'Soru':'Question'}: ${cut(question, 140)}. ` +
        (urgent
          ? (lang==='tr'?'Acil işaret olabilir; ACİL uyarı ile başla. ':'Urgent flags possible; start with URGENT. ')
          : '') +
        (lang==='tr'
          ? 'SADECE Türkçe yanıt ver. En fazla 5 kısa satır.'
          : 'Answer ONLY in English. Max 5 short lines.');
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

/** ------------ POST (Q&A) ------------ */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    // Optional Tally mapping
    let ageMonths = Number(body?.ageMonths ?? 0);
    let question = (body?.question ?? '').toString();
    if ((!ageMonths || !question) && body?.data?.fields?.length) {
      const fields: any[] = body.data.fields;
      const ageField = fields.find(f => /age|yaş|yas/i.test(f?.key || f?.label));
      const qField   = fields.find(f => /question|soru/i.test(f?.key || f?.label));
      if (ageField) ageMonths = Number(ageField.value || 0);
      if (qField)   question  = (qField.value || '').toString();
    }

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Missing parameter: question' }, { status: 400 });
    }
    if (Number.isNaN(ageMonths) || ageMonths < 0) ageMonths = 0;

    // Dil algıla
    const lang: 'tr'|'en' = detectLang(question);

    // Very short question → ask details (in detected language)
    if (question.trim().length < 12) {
      const msg = lang === 'tr'
        ? 'Sorunuz çok kısa görünüyor. Lütfen şunları ekleyin:\n• Bebeğin yaşı (ay)\n• Ölçtüğünüz en yüksek ateş ve nasıl ölçtünüz\n• Eşlik eden belirtiler (nefes darlığı, kusma vb.)'
        : 'Your question seems too short. Please add:\n• Baby age in months\n• Highest measured temperature and how you measured it\n• Any accompanying symptoms (breathing difficulty, vomiting, etc.)';
      return NextResponse.json({
        answer: (lang==='tr'?'🔺 Fallback\n':'🔺 Fallback\n') + msg,
        candidates: [],
        disclaimer: lang==='tr'?DISCLAIMER_TR:DISCLAIMER_EN,
        meta: { source: 'FALLBACK', llmUsed: false, llmError: null, provider: 'rules', matchedFaqs: 0, urgent: false }
      }, { status: 400 });
    }

    // Rule-based urgent cut
    const risk = evaluateRisk(ageMonths, question);
    if (risk.emergency) {
      const t = risk.temp;
      const answer = lang === 'tr'
        ? '🔺 ACİL UYARI\n' +
          (t ? `• Bildirilen ateş: ~${t}°C.\n` : '') +
          '• 40°C ve üzeri ateş veya 3 aydan küçük bebekte ≥38°C acil değerlendirme gerektirebilir.\n' +
          '• Hemen sağlık kuruluşuna başvurun veya 112’yi arayın.\n' +
          '• İnce giydirin, serin/iyi havalandırılmış ortam; sık sık sıvı teklif edin.\n' +
          '• Soğuk duş/alkollü ovma yapmayın; doz bilgisi vermem.'
        : '🔺 URGENT WARNING\n' +
          (t ? `• Reported temperature: ~${t}°C.\n` : '') +
          '• ≥40°C fever or infants <3 months with ≥38°C may require immediate evaluation.\n' +
          '• Seek medical care now or call your local emergency number.\n' +
          '• Dress lightly, keep a cool/ventilated room; offer fluids frequently.\n' +
          '• Do NOT use cold baths or alcohol rubs; no dosing instructions provided.';
      return NextResponse.json({
        answer, candidates: [], disclaimer: lang==='tr'?DISCLAIMER_TR:DISCLAIMER_EN,
        meta: { source: 'FALLBACK', llmUsed: false, llmError: null, provider: 'rules', matchedFaqs: 0, urgent: true }
      });
    }

    const urgent = detectUrgent(ageMonths, question);

    // Save question (best-effort)
    try {
      const supa = supabaseServer();
      await supa.from('questions').insert({ user_id: null, child_age_months: ageMonths, text: question });
    } catch {}

    // Candidate FAQs
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
        .map((f: any) => {
          const hay = `${f.category ?? ''} ${f.question} ${f.answer}`.toLowerCase();
          const score = kws.reduce((acc: number, w: string) => (hay.includes(w) ? acc + 1 : acc), 0);
          return { ...f, _score: score };
        })
        .sort((a: any, b: any) => b._score - a._score)
        .slice(0, 2)
        .map((f: any) => { delete f._score; return f as Faq; });
    } catch { faqs = []; }

    // LLM
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
      answer = lang === 'tr'
        ? '🔺 Fallback\nÖn değerlendirme: Metne göre acil tehlike görünmüyor. Çocuğu gözlemleyin ve sıvı alımını takip edin. Belirtiler artarsa sağlık profesyoneline başvurun.'
        : '🔺 Fallback\nInitial assessment: no immediate danger detected based on your text. Monitor your child and keep up with fluids. If symptoms worsen or new red flags appear, seek medical care.';
    }

    return NextResponse.json({
      answer,
      candidates: faqs,
      disclaimer: lang==='tr'?DISCLAIMER_TR:DISCLAIMER_EN,
      meta: { source, llmUsed, llmError, provider, matchedFaqs: faqs.length, urgent }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Unprocessable request', detail: e?.message || 'unknown' },
      { status: 500 }
    );
  }
}
