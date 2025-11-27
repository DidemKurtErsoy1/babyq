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
    <main style={{ background: '#F7F0E5', minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '32px 18px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <header style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, color: '#0E0A05' }}>Articles</h1>
          <p style={{ opacity: 0.8, fontSize: 16 }}>Evidence-aware, parent-friendly reading.</p>
        </header>

        {/* Categories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          {categories.map(c => {
            const active = c === cat;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                aria-pressed={active}
                className={`chip ${active ? 'active' : ''}`}
              >
                {c === 'All' ? 'All' : c}
              </button>
            );
          })}
        </div>

        {/* List */}
        <ul style={{ display: 'grid', gap: 18, padding: 0, listStyle: 'none' }}>
          {filtered.map(a => (
            <li key={a.slug}>
              <Link
                href={`/articles/${a.slug}`}
                style={{
                  display: 'block',
                  border: '1px solid #EAE2D4',
                  borderRadius: 16,
                  padding: 18,
                  background: '#FFF',
                  boxShadow: '0 10px 26px rgba(0,0,0,0.06)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.1s ease, box-shadow 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span
                    aria-label="category"
                    style={{
                      fontSize: 12,
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid #DDD',
                      background: '#FBF7EE',
                      color: '#3B3220',
                    }}
                  >
                    🏷️ {a.category}
                  </span>
                  <span style={{ fontSize: 13, color: '#6B6250' }}>
                    Last updated: {new Date(a.updated).toLocaleDateString()} · By {a.author}
                  </span>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#0E0A05' }}>
                  {a.title}
                </h2>
                <p style={{ opacity: 0.85, marginTop: 0, marginBottom: 12, lineHeight: 1.5, fontSize: 16 }}>
                  {a.excerpt}
                </p>
                <span style={{ fontWeight: 700, color: '#0E0A05', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Read more →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .chip {
          padding: 9px 14px;
          border-radius: 999px;
          border: 1px solid #CFC7B7;
          background: #fff;
          color: #0E0A05;
          cursor: pointer;
          font-weight: 700;
          transition: background 0.15s ease, color 0.15s ease, box-shadow 0.2s ease, transform 0.1s ease;
        }

        .chip:hover {
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .chip.active {
          background: #111;
          color: #FAF7F0;
          border-color: #0E0A05;
        }

        .chip.active:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
        }

        @media (max-width: 640px) {
          .chip {
            flex: 1 1 auto;
            text-align: center;
          }
        }

        li a:hover {
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}
