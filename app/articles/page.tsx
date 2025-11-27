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
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFF7EC 0%, #FFEFD9 28%, #FFF7EC 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '36px 20px 54px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <header style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 33, fontWeight: 800, marginBottom: 6, color: '#18110B' }}>Articles</h1>
          <p style={{ opacity: 0.82, fontSize: 16, color: '#6F665D' }}>
            Evidence-aware, parent-friendly reading.
          </p>
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
        <ul style={{ display: 'grid', gap: 20, padding: 0, listStyle: 'none' }}>
          {filtered.map(a => (
            <li key={a.slug}>
              <Link
                href={`/articles/${a.slug}`}
                style={{
                  display: 'block',
                  border: '1px solid #F0DED0',
                  borderRadius: 18,
                  padding: 20,
                  background: '#FFFFFF',
                  boxShadow: '0 14px 36px rgba(0,0,0,0.06)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.1s ease, box-shadow 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span
                    aria-label="category"
                    style={{
                      fontSize: 12,
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: '1px solid #C6DDE1',
                      background: '#E7F6F8',
                      color: '#1F4B52',
                      fontWeight: 700,
                      letterSpacing: 0.1,
                    }}
                  >
                    🏷️ {a.category}
                  </span>
                  <span style={{ fontSize: 13, color: '#6F665D' }}>
                    Last updated: {new Date(a.updated).toLocaleDateString()} · By {a.author}
                  </span>
                </div>

                <h2 style={{ fontSize: 21, fontWeight: 750, margin: '0 0 8px', color: '#18110B' }}>
                  {a.title}
                </h2>
                <p style={{ opacity: 0.9, marginTop: 0, marginBottom: 16, lineHeight: 1.55, fontSize: 16, color: '#1C1A17' }}>
                  {a.excerpt}
                </p>
                <span
                  style={{
                    fontWeight: 750,
                    color: '#4BA6B5',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
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
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid #E4D3BF;
          background: #ffffff;
          color: #18110B;
          cursor: pointer;
          font-weight: 750;
          transition: background 0.15s ease, color 0.15s ease, box-shadow 0.2s ease, transform 0.1s ease,
            border-color 0.2s ease;
        }

        .chip:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
          background: #fff9ef;
        }

        .chip.active {
          background: #ffb545;
          color: #18110b;
          border-color: #e5a03a;
          box-shadow: 0 10px 22px rgba(255, 181, 69, 0.35);
        }

        .chip.active:hover {
          background: #d6800f;
          color: #ffffff;
          box-shadow: 0 12px 26px rgba(214, 128, 15, 0.35);
        }

        @media (max-width: 640px) {
          .chip {
            flex: 1 1 auto;
            text-align: center;
          }
        }

        li a:hover {
          box-shadow: 0 16px 38px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}
