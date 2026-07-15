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
    <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FFF8F0 0%, #F0FAF4 40%, #FFF8F0 100%)' }}>
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '36px 20px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <header style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, color: '#1A3328', letterSpacing: '-0.3px' }}>
            Articles
          </h1>
          <p style={{ fontSize: 17, color: '#4A6B55', lineHeight: 1.6 }}>
            Evidence-aware, parent-friendly reading.
          </p>
        </header>

        {/* Categories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
          {categories.map(c => {
            const active = c === cat;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                aria-pressed={active}
                className={`chip ${active ? 'active' : ''}`}
              >
                {c}
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
                  border: '1px solid #C8E2D4',
                  borderRadius: 22,
                  padding: '22px 24px',
                  background: '#FFFFFF',
                  boxShadow: '0 8px 28px rgba(44, 122, 86, 0.07)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                }}
                className="article-card"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span
                    aria-label="category"
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 999,
                      border: '1px solid #A8DDB8',
                      background: '#E2F5EC',
                      color: '#1E5E3A',
                      fontWeight: 700,
                      letterSpacing: 0.2,
                    }}
                  >
                    🏷️ {a.category}
                  </span>
                  <span style={{ fontSize: 13, color: '#636E72' }}>
                    Updated {new Date(a.updated).toLocaleDateString()} · {a.author}
                  </span>
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', color: '#1A3328' }}>
                  {a.title}
                </h2>
                <p style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.6, fontSize: 16, color: '#2D3436', opacity: 0.88 }}>
                  {a.excerpt}
                </p>
                <span
                  style={{
                    fontWeight: 700,
                    color: '#4CAF7D',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 15,
                  }}
                >
                  Read more →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .chip {
          padding: 10px 18px;
          border-radius: 999px;
          border: 1.5px solid #C8E2D4;
          background: #ffffff;
          color: #2D3436;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          font-family: inherit;
          transition: background 0.15s ease, color 0.15s ease, box-shadow 0.2s ease, transform 0.1s ease, border-color 0.15s ease;
        }
        .chip:hover {
          background: #EDF9F3;
          border-color: #A8DDB8;
          color: #1E5E3A;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(76, 175, 125, 0.18);
        }
        .chip.active {
          background: linear-gradient(135deg, #4CAF7D 0%, #3D9A6D 100%);
          color: #ffffff;
          border-color: #3D9A6D;
          box-shadow: 0 8px 22px rgba(76, 175, 125, 0.32);
        }
        .chip.active:hover {
          background: linear-gradient(135deg, #3D9A6D 0%, #2E7D56 100%);
          box-shadow: 0 10px 26px rgba(76, 175, 125, 0.4);
        }
        @media (max-width: 640px) {
          .chip {
            flex: 1 1 auto;
            text-align: center;
          }
        }
        .article-card:hover {
          box-shadow: 0 16px 40px rgba(44, 122, 86, 0.14) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}
