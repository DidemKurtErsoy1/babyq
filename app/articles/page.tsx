// app/articles/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { articles } from './data';

const categories = ['All', 'Fever', 'Feeding', 'Sleep', 'Respiratory', 'Newborn Care', 'Safety', 'Skin & Bathing'] as const;
type Cat = (typeof categories)[number];

export default function ArticlesPage() {
  const [cat, setCat] = useState<Cat>('All');

  const filtered = useMemo(
    () => (cat === 'All' ? articles : articles.filter(a => a.category === cat)),
    [cat]
  );

  return (
    <main className="page-shell">
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '48px 20px 72px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <header style={{ marginBottom: 4 }}>
          <span className="badge badge-gold" style={{ marginBottom: 12 }}>📚 {articles.length} articles</span>
          <h1 style={{ fontSize: 38, fontWeight: 800, margin: '10px 0 8px', color: 'var(--brand)', letterSpacing: '-0.03em' }}>
            Articles
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-secondary)', lineHeight: 1.6, margin: 0 }}>
            Evidence-aware, parent-friendly reading.
          </p>
        </header>

        {/* Categories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          {categories.map(c => {
            const active = c === cat;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                aria-pressed={active}
                className={`chip ${active ? 'chip-active' : ''}`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* List */}
        <ul style={{ display: 'grid', gap: 16, padding: 0, listStyle: 'none' }}>
          {filtered.map(a => (
            <li key={a.slug}>
              <Link
                href={`/articles/${a.slug}`}
                className="card card-hover"
                style={{
                  display: 'block',
                  padding: '24px 26px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span aria-label="category" className="badge badge-accent">
                    🏷️ {a.category}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--ink-tertiary)' }}>
                    Updated {new Date(a.updated).toLocaleDateString()} · {a.author}
                  </span>
                </div>

                <h2 style={{ fontSize: 21, fontWeight: 750, margin: '0 0 8px', color: 'var(--ink)' }}>
                  {a.title}
                </h2>
                <p style={{ marginTop: 0, marginBottom: 14, lineHeight: 1.6, fontSize: 15.5, color: 'var(--ink-secondary)' }}>
                  {a.excerpt}
                </p>
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--accent-strong)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14.5,
                  }}
                >
                  Read more →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
