// app/articles/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articles } from '../data';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = articles.find(x => x.slug === params.slug);
  if (!a) return notFound();

  return (
    <main className="page-shell">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '44px 20px 80px' }}>
        <nav style={{ marginBottom: 20 }}>
          <Link
            href="/articles"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 14, fontWeight: 650, color: 'var(--accent-strong)',
            }}
          >
            ← Back to Articles
          </Link>
        </nav>

        <header style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span aria-label="category" className="badge badge-accent">🏷️ {a.category}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-tertiary)' }}>
              Last updated: {new Date(a.updated).toLocaleDateString()} · By {a.author}
            </span>
          </div>

          <h1 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 10px', color: 'var(--brand)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {a.title}
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: 16.5, lineHeight: 1.6, margin: 0 }}>{a.excerpt}</p>
        </header>

        {/* Sections */}
        <article style={{ display: 'grid', gap: 16 }}>
          {a.sections.map((s, idx) => (
            <section key={idx} className="card" style={{ padding: '22px 24px' }}>
              <h2 style={{ fontSize: 18.5, fontWeight: 750, margin: '0 0 10px', color: 'var(--ink)' }}>{s.heading}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i} style={{ marginTop: i === 0 ? 0 : 10, lineHeight: 1.7, fontSize: 15, color: 'var(--ink-secondary)' }}>{p}</p>
              ))}
            </section>
          ))}

          {/* Mini FAQ */}
          {a.faqs?.length ? (
            <section className="card" style={{ padding: '22px 24px' }}>
              <h2 style={{ fontSize: 18.5, fontWeight: 750, margin: '0 0 14px', color: 'var(--ink)' }}>FAQ</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                {a.faqs.map((f, i) => (
                  <div key={i} style={{ paddingBottom: i < a.faqs.length - 1 ? 14 : 0, borderBottom: i < a.faqs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontWeight: 650, fontSize: 14.5, color: 'var(--ink)', marginBottom: 4 }}>{f.q}</div>
                    <div style={{ fontSize: 14.5, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>{f.a}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Resources */}
          {a.resources?.length ? (
            <section className="card" style={{ padding: '22px 24px' }}>
              <h2 style={{ fontSize: 18.5, fontWeight: 750, margin: '0 0 12px', color: 'var(--ink)' }}>Resources</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {a.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="chip" style={{ fontSize: 13.5 }}>
                    🔗 {r.label}
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </div>
    </main>
  );
}
