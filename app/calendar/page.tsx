'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../lib/useAuth';
import { getSupabaseBrowser } from '../../lib/supabaseBrowser';
import { useI18n } from '../../lib/useI18n';
import { VACCINE_SCHEDULE, visitDate } from '../../lib/vaccineSchedule';

type Baby = { id: string; name: string; birth_date: string };

const LS_KEY = 'babyq_babies_v1';

const C = {
  en: {
    title: 'Vaccination calendar',
    subtitle: 'See what’s done, what’s due, and what’s coming — based on your baby’s birth date.',
    whoseBirth: 'Whose calendar?',
    enterBirth: 'Enter a birth date to see the schedule',
    birthDate: 'Date of birth',
    nextUp: 'Next up',
    dueWindow: 'around',
    inDays: (n: number) => (n <= 0 ? 'due now' : n === 1 ? 'in 1 day' : `in ${n} days`),
    past: 'Scheduled by this age',
    upcoming: 'Upcoming',
    disclaimer:
      'Based on the T.C. Sağlık Bakanlığı standard childhood schedule. This is a reminder, not a medical record — confirm exact doses and dates with your pediatrician and your e-Nabız record.',
    source: 'Official schedule',
    noBirth: 'Add a birth date on your profile, or enter one here, to see the calendar.',
  },
  tr: {
    title: 'Aşı takvimi',
    subtitle: 'Yapılanları, zamanı gelenleri ve yaklaşanları görün — bebeğinizin doğum tarihine göre.',
    whoseBirth: 'Kimin takvimi?',
    enterBirth: 'Takvimi görmek için doğum tarihi girin',
    birthDate: 'Doğum tarihi',
    nextUp: 'Sıradaki',
    dueWindow: 'yaklaşık',
    inDays: (n: number) => (n <= 0 ? 'zamanı geldi' : n === 1 ? '1 gün içinde' : `${n} gün içinde`),
    past: 'Bu yaşta planlanmıştı',
    upcoming: 'Yaklaşan',
    disclaimer:
      'T.C. Sağlık Bakanlığı standart çocukluk dönemi takvimine dayanır. Bu bir hatırlatmadır, tıbbi kayıt değildir — kesin doz ve tarihleri doktorunuza ve e-Nabız kaydınıza göre teyit edin.',
    source: 'Resmî takvim',
    noBirth: 'Takvimi görmek için profilinize doğum tarihi ekleyin veya buraya girin.',
  },
} as const;

function fmtDate(d: Date, lang: 'en' | 'tr') {
  return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const c = C[lang];

  const [babies, setBabies] = useState<Baby[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualBirth, setManualBirth] = useState('');

  useEffect(() => {
    async function load() {
      let loaded: Baby[] = [];
      if (user) {
        const supa = getSupabaseBrowser();
        if (supa) {
          const { data } = await supa
            .from('babies')
            .select('id, name, birth_date')
            .order('created_at', { ascending: true });
          loaded = (data as Baby[]) || [];
        }
      } else {
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) loaded = JSON.parse(raw);
        } catch {}
      }
      const withBirth = loaded.filter((b) => b.birth_date);
      setBabies(withBirth);
      if (withBirth.length > 0) setSelectedId(withBirth[0].id);
    }
    load();
  }, [user]);

  const birthISO = useMemo(() => {
    if (selectedId) return babies.find((b) => b.id === selectedId)?.birth_date || '';
    return manualBirth;
  }, [selectedId, babies, manualBirth]);

  const rows = useMemo(() => {
    if (!birthISO) return [];
    const today = new Date();
    const list = VACCINE_SCHEDULE.map((v) => {
      const date = visitDate(birthISO, v.ageMonths);
      const isPast = date.getTime() < today.getTime();
      const days = Math.round((date.getTime() - today.getTime()) / 86400000);
      return { ...v, date, isPast, days };
    });
    return list;
  }, [birthISO]);

  const nextIdx = rows.findIndex((r) => !r.isPast);
  const nextRow = nextIdx >= 0 ? rows[nextIdx] : null;

  return (
    <main className="page-shell">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px 72px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <header>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', color: 'var(--brand)', letterSpacing: '-0.02em' }}>
            💉 {c.title}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-secondary)', lineHeight: 1.6, margin: 0 }}>{c.subtitle}</p>
        </header>

        {/* Baby / birth-date selector */}
        <section className="card" style={{ padding: '22px 24px', display: 'grid', gap: 14 }}>
          {babies.length > 0 ? (
            <div>
              <label className="field-label">{c.whoseBirth}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {babies.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedId(b.id)}
                    className={`chip ${selectedId === b.id ? 'chip-active' : ''}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="birth" className="field-label">{c.enterBirth}</label>
              <input
                id="birth"
                type="date"
                value={manualBirth}
                onChange={(e) => setManualBirth(e.target.value)}
                className="input"
                style={{ maxWidth: 260 }}
              />
            </div>
          )}
        </section>

        {!birthISO && (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-secondary)' }}>
            {c.noBirth}
          </div>
        )}

        {/* Next-up highlight */}
        {nextRow && (
          <section
            className="card"
            style={{
              padding: '22px 24px',
              borderLeft: '5px solid var(--gold)',
              background: 'linear-gradient(180deg, var(--gold-soft), var(--surface))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="badge badge-gold">🔔 {c.nextUp}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-secondary)', fontWeight: 600 }}>
                {c.inDays(nextRow.days)}
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 750, color: 'var(--ink)', marginBottom: 2 }}>
              {nextRow.ageLabel[lang]} · {c.dueWindow} {fmtDate(nextRow.date, lang)}
            </div>
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'grid', gap: 5 }}>
              {nextRow.vaccines.map((v, i) => (
                <li key={i} style={{ fontSize: 14.5, color: 'var(--ink-secondary)' }}>{v[lang]}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Full timeline */}
        {rows.length > 0 && (
          <section style={{ display: 'grid', gap: 12 }}>
            {rows.map((r, idx) => {
              const isNext = idx === nextIdx;
              return (
                <article
                  key={r.ageMonths}
                  className="card"
                  style={{
                    padding: '18px 22px',
                    opacity: r.isPast ? 0.62 : 1,
                    borderLeft: isNext ? '4px solid var(--gold)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16, fontWeight: 750, color: 'var(--ink)' }}>{r.ageLabel[lang]}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-tertiary)' }}>{fmtDate(r.date, lang)}</span>
                    <span style={{ marginLeft: 'auto' }}>
                      {r.isPast ? (
                        <span className="badge badge-neutral">✓ {c.past}</span>
                      ) : isNext ? (
                        <span className="badge badge-gold">🔔 {c.nextUp}</span>
                      ) : (
                        <span className="badge badge-accent">{c.upcoming}</span>
                      )}
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
                    {r.vaccines.map((v, i) => (
                      <li key={i} style={{ fontSize: 14, color: 'var(--ink-secondary)' }}>{v[lang]}</li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </section>
        )}

        {/* Disclaimer + source */}
        <div className="alert alert-warn" style={{ marginTop: 4, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <span>⚠️ {c.disclaimer}</span>
          <a
            href="https://asi.saglik.gov.tr/"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-strong)' }}
          >
            {c.source} → asi.saglik.gov.tr
          </a>
        </div>
      </div>
    </main>
  );
}
