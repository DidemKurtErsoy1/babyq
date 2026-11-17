// evals/emergency/run.ts
//
// Emergency-safety eval for BabyQ.
//
//   npm run eval:emergency            → rules only (offline, free, instant)
//   npm run eval:emergency -- --live  → full /api/ask pipeline incl. Gemini
//
// Live mode targets EVAL_BASE_URL (default http://localhost:3000). Requests
// carry an `x-babyq-eval: 1` header so the route does not store them in the
// `questions` table. They are paced to stay under the route's rate limit.
//
// Exit code 1 when any emergency is missed, an answer is unsafe, or a request
// errors — so it can gate a release. False alarms are reported, not fatal.

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateRisk } from '../../lib/askLogic';
import { grade, summarize, answerSignalsUrgent, type EvalCase, type Graded, type Observation } from '../lib/grade';

const here = dirname(fileURLToPath(import.meta.url));
const live = process.argv.includes('--live');
const baseUrl = (process.env.EVAL_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PACE_MS = Number(process.env.EVAL_PACE_MS || 6000); // route allows 12/min per IP

const { cases } = JSON.parse(readFileSync(join(here, 'cases.json'), 'utf8')) as { cases: EvalCase[] };

function observeRules(c: EvalCase): Observation {
  return { flaggedUrgent: evaluateRisk(c.ageMonths, c.question).emergency };
}

async function observeLive(c: EvalCase): Promise<Observation> {
  try {
    const res = await fetch(`${baseUrl}/api/ask?lang=${c.lang.toLowerCase()}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-babyq-eval': '1' },
      body: JSON.stringify({ question: c.question, ageMonths: c.ageMonths }),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) return { flaggedUrgent: false, error: `HTTP ${res.status}: ${json?.error || json?.answer || ''}`.trim() };
    const answer: string = json?.answer ?? '';
    return { flaggedUrgent: Boolean(json?.meta?.urgent) || answerSignalsUrgent(answer), answer };
  } catch (e: any) {
    return { flaggedUrgent: false, error: `İstek başarısız: ${e?.message || e}` };
  }
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const LABEL: Record<Graded['outcome'], string> = {
  pass: '✅ geçti',
  'missed-emergency': '🚨 ACİL KAÇTI',
  'false-alarm': '⚠️ yanlış alarm',
  'unsafe-content': '🚨 güvensiz cevap',
  error: '❌ hata',
};

async function main() {
  const mode = live ? `live (${baseUrl})` : 'rules (offline)';
  console.log(`BabyQ acil durum eval — ${mode} — ${cases.length} vaka\n`);

  const results: Graded[] = [];
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    if (live && i > 0) await new Promise((r) => setTimeout(r, PACE_MS));
    const g = grade(c, live ? await observeLive(c) : observeRules(c));
    results.push(g);
    console.log(`${LABEL[g.outcome].padEnd(18)} ${c.id.padEnd(18)} ${g.notes.join(' ')}`);
  }

  const s = summarize(results);
  const lines = [
    `# BabyQ acil durum eval`,
    ``,
    `- Mod: ${mode}`,
    `- Tarih: ${new Date().toISOString()}`,
    `- Sonuç: **${s.passed ? 'GEÇTİ' : 'KALDI'}**`,
    ``,
    `| Ölçüt | Değer |`,
    `|---|---|`,
    `| Acil vakaları yakalama (duyarlılık) | ${pct(s.sensitivity)} (${s.caught}/${s.emergencies}) |`,
    `| Normal soruda alarm vermeme (özgüllük) | ${pct(s.specificity)} (${s.routines - s.falseAlarms}/${s.routines}) |`,
    `| Kaçırılan acil | ${s.missed} |`,
    `| Yanlış alarm | ${s.falseAlarms} |`,
    `| Güvensiz cevap | ${s.unsafe} |`,
    `| Hata | ${s.errors} |`,
    ``,
    `## Başarısız vakalar`,
    ``,
    ...results
      .filter((r) => r.outcome !== 'pass')
      .map((r) => `- **${LABEL[r.outcome]}** \`${r.case.id}\` (${r.case.category}, ${r.case.ageMonths} ay): "${r.case.question}" — ${r.case.why} ${r.notes.join(' ')}`),
    ``,
  ];
  if (live) {
    lines.push('## Cevaplar', '');
    for (const r of results) {
      lines.push(`### ${r.case.id} — ${LABEL[r.outcome]}`, '', `**Soru:** ${r.case.question}`, '', '```', r.answer ?? '(cevap yok)', '```', '');
    }
  }

  const reportDir = join(here, '..', 'reports');
  mkdirSync(reportDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = join(reportDir, `emergency-${live ? 'live' : 'rules'}-${stamp}.md`);
  writeFileSync(file, lines.join('\n'));

  console.log(
    `\nDuyarlılık ${pct(s.sensitivity)} · Özgüllük ${pct(s.specificity)} · ` +
      `kaçan acil ${s.missed} · yanlış alarm ${s.falseAlarms} · güvensiz ${s.unsafe} · hata ${s.errors}`
  );
  console.log(`Sonuç: ${s.passed ? 'GEÇTİ' : 'KALDI'}   Rapor: ${file}`);
  process.exit(s.passed ? 0 : 1);
}

main();
