// app/articles/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { articles } from './data';

const categories = ['All', 'Fever', 'Feeding', 'Sleep', 'Respiratory'] as const;
type Cat = (typeof categories)[number];

export default function ArticlesPage() {
  const [cat, setCat] = useState<Cat>('All');

  const filtered = useMemo(
    () => (cat === 'All' ? articles : articles.filter(a => a.category === cat)),
    [cat]
  );

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Articles</h1>
        <p style={{ opacity: 0.8 }}>Evidence-aware, parent-friendly reading.</p>
      </header>

      {/* Categories */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {categories.map(c => {
          const active = c === cat;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={active}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #DDD',
                background: active ? '#111' : '#FAF7F0',
                color: active ? '#FAF7F0' : '#111',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {c === 'All' ? 'All' : c}
            </button>
          );
        })}
      </div>

      {/* List */}
      <ul style={{ display: 'grid', gap: 12 }}>
        {filtered.map(a => (
          <li key={a.slug} style={{ border: '1px solid #EEE', borderRadius: 12, padding: 14, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                aria-label="category"
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid #DDD',
                  background: '#FAF7F0'
                }}
              >
                🏷️ {a.category}
              </span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                Last updated: {new Date(a.updated).toLocaleDateString()}
              </span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>• By {a.author}</span>
            </div>

            <h2 style={{ fontSize: 18, margin: 0 }}>
              <Link href={`/articles/${a.slug}`}>{a.title}</Link>
            </h2>
            <p style={{ opacity: 0.85, marginTop: 6 }}>{a.excerpt}</p>
            <Link href={`/articles/${a.slug}`} style={{ textDecoration: 'underline' }}>
              Read more →
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
